// functions/index.js
// Firebase Cloud Functions — deploy with: firebase deploy --only functions

const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
const db = getFirestore()
const messaging = getMessaging()

// ── Mood Analysis: Triggered when a new mood log is created ──────
exports.analyzeMoodOnCreate = onDocumentCreated('moodLogs/{logId}', async (event) => {
  const log = event.data.data()
  const { uid } = log

  // Get last 7 logs
  const snapshot = await db.collection('moodLogs')
    .where('uid', '==', uid)
    .orderBy('timestamp', 'desc')
    .limit(7)
    .get()

  const logs = snapshot.docs.map(d => d.data())
  const moodValues = { terrible: 1, sad: 2, neutral: 3, good: 4, great: 5 }
  const scores = logs.map(l => moodValues[l.mood] || 3)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length

  // Get user profile for FCM token
  const userDoc = await db.collection('users').doc(uid).get()
  const userData = userDoc.data()

  if (!userData?.fcmToken) return

  // Send alert if avg mood is critically low
  if (avg < 2.5 && logs.length >= 3) {
    await messaging.send({
      token: userData.fcmToken,
      notification: {
        title: 'WellNest — We care about you 💙',
        body: "You've been feeling low recently. Remember, help is always available. Tap to access support resources.",
      },
      data: { type: 'mood_alert', avgScore: String(Math.round(avg * 10) / 10) },
    })
  }

  // Update user streak
  const today = new Date().toDateString()
  const lastLogDate = userData.lastLogDate
  const streakUpdate = lastLogDate === new Date(Date.now() - 86400000).toDateString()
    ? (userData.streak || 0) + 1
    : lastLogDate === today ? userData.streak || 1 : 1

  await db.collection('users').doc(uid).update({
    streak: streakUpdate,
    lastLogDate: today,
  })
})

// ── Daily Reminder: Send push notification at 8pm ───────────────
exports.dailyMoodReminder = onSchedule('0 14 * * *', async () => { // 14:00 UTC = ~8pm IST
  const usersSnap = await db.collection('users')
    .where('fcmToken', '!=', null)
    .limit(500)
    .get()

  const messages = usersSnap.docs
    .map(d => d.data())
    .filter(u => u.fcmToken)
    .map(u => ({
      token: u.fcmToken,
      notification: {
        title: `Good evening, ${u.displayName?.split(' ')[0] || 'Friend'} 🌙`,
        body: "How are you feeling today? Take a moment to log your mood and check in with yourself.",
      },
      data: { type: 'daily_reminder' },
    }))

  if (messages.length > 0) {
    await messaging.sendEach(messages)
  }
})
