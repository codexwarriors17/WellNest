
// src/firebase/firebaseMessaging.js
import { getToken, onMessage } from "firebase/messaging"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db, messaging } from "./firebaseConfig"

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export const requestNotificationPermission = async (uid) => {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null

    // messaging may be null if browser not supported
    if (!messaging) return null

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })

    if (token && uid) {
      await setDoc(
        doc(db, "users", uid),
        { fcmToken: token, fcmUpdatedAt: serverTimestamp() },
        { merge: true }
      )
    }

    return token
  } catch (err) {
    console.error("FCM token error:", err)
    return null
  }
}

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return resolve(null)
    onMessage(messaging, (payload) => resolve(payload))
  })