// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore"
import { getMessaging, isSupported } from "firebase/messaging"
import { getFunctions } from "firebase/functions"
import { getDatabase } from "firebase/database" // ✅ Realtime DB

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAEHEJpSd4nfs4eIUXZzX97pv4QN-RnJxQ",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "wellnest-7803a.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "wellnest-7803a",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "wellnest-7803a.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "215863511352",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || "1:215863511352:web:323efeca132faa7ea919cd",

  // ✅ Realtime Database URL (Fix)
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    "https://wellnest-7803a-default-rtdb.firebaseio.com",
}

const app = initializeApp(firebaseConfig)

// ✅ Auth
export const auth = getAuth(app)

// ✅ Firestore with offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

// ✅ Cloud Functions
export const functions = getFunctions(app)

// ✅ Realtime Database
export const rtdb = getDatabase(app)

// ✅ Messaging (FCM)
let _messagingInstance = null
export const getMessagingInstance = async () => {
  if (_messagingInstance) return _messagingInstance
  try {
    const supported = await isSupported()
    if (supported) {
      _messagingInstance = getMessaging(app)
      return _messagingInstance
    }
  } catch (e) {
    console.warn("Firebase Messaging not supported:", e?.message || e)
  }
  return null
}

export default app