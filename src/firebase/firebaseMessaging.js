// src/firebase/firebaseMessaging.js
import { getToken, onMessage, deleteToken } from 'firebase/messaging'
import { getMessagingInstance, VAPID_KEY } from './firebaseConfig'
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebaseConfig'

// ── Request permission + get FCM token ───────────────────────────────────────
/**
 * Requests notification permission from the browser, obtains the FCM token,
 * and saves it to Firestore users/{uid}.
 *
 * @param {string} uid - Firebase Auth uid
 * @returns {string|null} FCM token, or null on failure/denial
 */
export const requestNotificationPermission = async (uid) => {
  if (!uid) return null

  // Guard: VAPID key must be set
  if (!VAPID_KEY) {
    console.error('[FCM] VITE_FIREBASE_VAPID_KEY is missing — cannot get FCM token.')
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.info('[FCM] Notification permission:', permission)
      return null
    }

    const messaging = await getMessagingInstance()
    if (!messaging) return null

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (!token) {
      console.warn('[FCM] getToken returned empty — check VAPID key and SW registration.')
      return null
    }

    // Upsert: only set reminderEnabled on first setup (don't overwrite existing value)
    const snap = await getDoc(doc(db, 'users', uid))
    const existing = snap.exists() ? snap.data() : {}

    const updateData = {
      fcmToken: token,
      // Only default to true if field doesn't exist yet
      ...(existing.reminderEnabled === undefined && { reminderEnabled: true }),
    }

    // Use setDoc with merge so it works even if doc doesn't exist yet
    await setDoc(doc(db, 'users', uid), updateData, { merge: true })

    console.info('[FCM] Token saved to Firestore ✓')
    return token
  } catch (err) {
    console.error('[FCM] requestNotificationPermission error:', err)
    return null
  }
}

// ── Refresh token (call on app start for returning users) ────────────────────
/**
 * Silently refreshes the FCM token and updates Firestore.
 * Called on app load when permission is already 'granted'.
 *
 * @param {string} uid - Firebase Auth uid
 * @returns {string|null} refreshed token or null
 */
export const refreshFCMToken = async (uid) => {
  if (!uid || !VAPID_KEY) return null
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return null

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (token) {
      await setDoc(doc(db, 'users', uid), { fcmToken: token }, { merge: true })
      console.info('[FCM] Token refreshed ✓')
    }
    return token || null
  } catch (err) {
    console.warn('[FCM] Token refresh failed:', err.message)
    return null
  }
}

// ── Delete token (on logout or reminder toggle off) ──────────────────────────
/**
 * Deletes the FCM token from the browser and clears it from Firestore.
 * Should be called on logout AND when the user disables reminders.
 *
 * @param {string|null} uid - Firebase Auth uid (null = just delete local token)
 * @returns {boolean} success
 */
export const deleteFCMToken = async (uid) => {
  try {
    const messaging = await getMessagingInstance()
    if (messaging) {
      await deleteToken(messaging).catch((e) =>
        console.warn('[FCM] deleteToken error (non-fatal):', e.message)
      )
    }

    if (uid) {
      await setDoc(
        doc(db, 'users', uid),
        { fcmToken: null, reminderEnabled: false },
        { merge: true }
      )
      console.info('[FCM] Token deleted from Firestore ✓')
    }
    return true
  } catch (err) {
    console.warn('[FCM] deleteFCMToken error:', err.message)
    return false
  }
}

// ── Toggle reminder ───────────────────────────────────────────────────────────
/**
 * Enables or disables daily mood reminders.
 * ON  → re-request permission, get/refresh token, set reminderEnabled=true
 * OFF → delete token, set reminderEnabled=false
 *
 * @param {string} uid     - Firebase Auth uid
 * @param {boolean} enabled - desired state
 * @returns {boolean} success
 */
export const setReminderEnabled = async (uid, enabled) => {
  if (!uid) return false

  if (enabled) {
    const token = await requestNotificationPermission(uid)
    if (token) {
      await setDoc(doc(db, 'users', uid), { reminderEnabled: true }, { merge: true })
      return true
    }
    return false
  } else {
    return await deleteFCMToken(uid)
  }
}

// ── Foreground message listener ───────────────────────────────────────────────
/**
 * Returns an unsubscribe function for foreground FCM messages.
 * Used internally by useFCM hook.
 *
 * @param {function} callback - called with (payload)
 * @returns {function|null} unsubscribe fn
 */
export const subscribeForegroundMessages = async (callback) => {
  const messaging = await getMessagingInstance()
  if (!messaging) return null
  return onMessage(messaging, callback)
}