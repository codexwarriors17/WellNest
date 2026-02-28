// src/firebase/firebaseMessaging.js
import { getToken, onMessage, deleteToken } from 'firebase/messaging'
import { getMessagingInstance } from './firebaseConfig'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from './firebaseConfig'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

/**
 * Request permission, get FCM token, and save it to Firestore.
 * Also writes reminderEnabled: true on first setup.
 */
export const requestNotificationPermission = async (uid) => {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const messaging = await getMessagingInstance()
    if (!messaging) return null

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })

    if (token && uid) {
      const snap = await getDoc(doc(db, 'users', uid))
      const currentData = snap.data() || {}

      await updateDoc(doc(db, 'users', uid), {
        fcmToken: token,
        ...(currentData.reminderEnabled === undefined && { reminderEnabled: true }),
      })
    }
    return token
  } catch (err) {
    console.error('FCM token error:', err)
    return null
  }
}

/**
 * Refresh FCM token — call on app start for returning users with granted permission.
 */
export const refreshFCMToken = async (uid) => {
  try {
    const messaging = await getMessagingInstance()
    if (!messaging || !uid) return null
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (token) {
      await updateDoc(doc(db, 'users', uid), { fcmToken: token })
    }
    return token
  } catch (err) {
    console.warn('FCM token refresh failed:', err.message)
    return null
  }
}

/**
 * Delete FCM token and clear from Firestore (disables push reminders).
 */
export const deleteFCMToken = async (uid) => {
  try {
    const messaging = await getMessagingInstance()
    if (messaging) await deleteToken(messaging).catch(() => {})
    if (uid) {
      await updateDoc(doc(db, 'users', uid), {
        fcmToken: null,
        reminderEnabled: false,
      })
    }
    return true
  } catch (err) {
    console.warn('FCM token delete failed:', err.message)
    return false
  }
}

/**
 * Toggle daily reminder ON/OFF.
 * ON: re-request permission + refresh token + set reminderEnabled=true
 * OFF: delete token + set reminderEnabled=false
 */
export const setReminderEnabled = async (uid, enabled) => {
  if (!uid) return false
  if (enabled) {
    const token = await requestNotificationPermission(uid)
    if (token) {
      await updateDoc(doc(db, 'users', uid), { reminderEnabled: true })
      return true
    }
    return false
  } else {
    return await deleteFCMToken(uid)
  }
}

export const onMessageListener = async () => {
  const messaging = await getMessagingInstance()
  if (!messaging) return
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => resolve(payload))
  })
}
