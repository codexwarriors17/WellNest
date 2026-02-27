// src/firebase/firebaseConfig.js
// Replace these with your actual Firebase project credentials
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAEHEJpSd4nfs4eIUXZzX97pv4QN-RnJxQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "wellnest-7803a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "wellnest-7803a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "wellnest-7803a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "215863511352",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:215863511352:web:323efeca132faa7ea919cd",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Offline persistence failed: Multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('Offline persistence not supported in this browser')
  }
})

// Initialize messaging only if supported
export const getMessagingInstance = async () => {
  const supported = await isSupported()
  if (supported) {
    return getMessaging(app)
  }
  return null
}

export default app
