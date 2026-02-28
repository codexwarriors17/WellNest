// functions/index.js
// Firebase Cloud Functions — deploy with: firebase deploy --only functions

const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onSchedule }        = require('firebase-functions/v2/scheduler')
const { initializeApp }     = require('firebase-admin/app')
const { getFirestore }      = require('firebase-admin/firestore')
const { getMessaging }      = require('firebase-admin/messaging')

initializeApp()
const db        = getFirestore()
const messaging = getMessaging()

// ── Helper: safe send FCM (handles invalid tokens gracefully) ────────────
const safeSend = async (message, uid) => {
  try {
    await messaging.send(message)
    return true
  } catch (err) {
    // If token is invalid/expired, clear it from Firestore
    if (
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/registration-token-not-registered'
    ) {
      console.warn(`Clearing stale FCM token for user ${uid}`)
      await db.collection('users').doc(uid).update({
        fcmToken: null,
        reminderEnabled: false,
      }).catch(() => {})
    } else {
      console.error('FCM send error:', err.code, err.message)
    }
    return false
  }
}

// ── Mood Analysis: Triggered when a new mood log is created ─────────────
exports.analyzeMoodOnCreate = onDocumentCreated('moodLogs/{logId}', async (event) => {
  const log = event.data.data()
  const { uid } = log

  if (!uid) return

  // Get last 7 logs for trend analysis
  const snapshot = await db.collection('moodLogs')
    .where('uid', '==', uid)
    .orderBy('timestamp', 'desc')
    .limit(7)
    .get()

  const logs = snapshot.docs.map(d => d.data())
  const moodValues = { terrible: 1, sad: 2, neutral: 3, good: 4, great: 5 }
  const scores = logs.map(l => moodValues[l.mood] || 3)
  const avg    = scores.reduce((a, b) => a + b, 0) / scores.length

  // Get user profile for FCM token and reminder settings
  const userDoc  = await db.collection('users').doc(uid).get()
  const userData = userDoc.data()

  if (!userData) return

  // Update streak
  const today     = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const lastLogDate = userData.lastLogDate

  let newStreak = 1
  if (lastLogDate === yesterday) {
    newStreak = (userData.streak || 0) + 1
  } else if (lastLogDate === today) {
    newStreak = userData.streak || 1
  }

  await db.collection('users').doc(uid).update({
    streak:      newStreak,
    lastLogDate: today,
  })

  // ── Critical mood alert ─────────────────────────────────────────────────
  // Only send if: user has FCM token + enough logs + avg critically low
  if (userData.fcmToken && logs.length >= 3 && avg < 2.5) {
    await safeSend({
      token: userData.fcmToken,
      notification: {
        title: 'WellNest — We care about you 💙',
        body:  "You've been feeling low recently. Help is always available — tap to access support resources.",
      },
      data: {
        type:     'mood_alert',
        avgScore: String(Math.round(avg * 10) / 10),
      },
    }, uid)
  }
})

// ── Daily Reminder: 8pm IST (14:00 UTC) ────────────────────────────────
exports.dailyMoodReminder = onSchedule('0 14 * * *', async () => {
  const usersSnap = await db.collection('users')
    .where('fcmToken', '!=', null)
    .limit(500)
    .get()

  const messages = usersSnap.docs
    .map(d => d.data())
    .filter(u =>
      u.fcmToken &&
      // ✅ Respect the reminderEnabled toggle — only send if true or unset (default opt-in)
      u.reminderEnabled !== false
    )
    .map(u => ({
      token: u.fcmToken,
      notification: {
        title: `Good evening, ${u.displayName?.split(' ')[0] || 'Friend'} 🌙`,
        body:  'How are you feeling today? Take a moment to log your mood and check in with yourself.',
      },
      data: { type: 'daily_reminder' },
    }))

  if (messages.length === 0) {
    console.log('No users to remind.')
    return
  }

  // sendEach handles tokens individually so one bad token doesn't block others
  const result = await messaging.sendEach(messages)
  console.log(`Daily reminder: ${result.successCount} sent, ${result.failureCount} failed.`)

  // Clean up stale tokens from failed sends
  const cleanupPromises = []
  result.responses.forEach((res, idx) => {
    if (
      !res.success &&
      (
        res.error?.code === 'messaging/invalid-registration-token' ||
        res.error?.code === 'messaging/registration-token-not-registered'
      )
    ) {
      const uid = usersSnap.docs[idx]?.id
      if (uid) {
        cleanupPromises.push(
          db.collection('users').doc(uid).update({
            fcmToken:        null,
            reminderEnabled: false,
          }).catch(() => {})
        )
      }
    }
  })

  await Promise.all(cleanupPromises)
})
