// src/firebase/firebaseMessaging.js
import { getToken, onMessage } from 'firebase/messaging'
import { getMessagingInstance } from './firebaseConfig'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from './firebaseConfig'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export const requestNotificationPermission = async (uid) => {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const messaging = await getMessagingInstance()
    if (!messaging) return null

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (token && uid) {
      await updateDoc(doc(db, 'users', uid), { fcmToken: token })
    }
    return token
  } catch (err) {
    console.error('FCM token error:', err)
    return null
  }
}

export const onMessageListener = async () => {
  const messaging = await getMessagingInstance()
  if (!messaging) return
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => resolve(payload))
  })
}

export const scheduleDailyReminder = () => {
  // For demo: use setTimeout to simulate a daily reminder after 30 seconds
  // In production, use Firebase Scheduled Functions
  if ('Notification' in window && Notification.permission === 'granted') {
    setTimeout(() => {
      new Notification('WellNest Reminder 🌿', {
        body: 'How are you feeling today? Take a moment to log your mood.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
      })
    }, 30000)
  }
}
