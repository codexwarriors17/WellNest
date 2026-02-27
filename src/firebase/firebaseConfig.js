
// src/firebase/firebaseConfig.js

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { 
  getFirestore, 
  enableIndexedDbPersistence 
} from "firebase/firestore"
import { getMessaging, isSupported } from "firebase/messaging"
import { getFunctions } from "firebase/functions"

// Firebase Config from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Auth
export const auth = getAuth(app)

// Firestore
export const db = getFirestore(app)

// Enable Offline Persistence (Very Important for Rural Areas)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab.")
  } else if (err.code === "unimplemented") {
    console.warn("Browser does not support offline persistence.")
  }
})

// Cloud Functions
export const functions = getFunctions(app)

// Messaging (FCM)
export let messaging = null

isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app)
  } else {
    console.warn("FCM not supported in this browser.")
  }
})

export default app