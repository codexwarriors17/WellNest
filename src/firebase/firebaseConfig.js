// src/firebase/firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || 'AIzaSyAEHEJpSd4nfs4eIUXZzX97pv4QN-RnJxQ',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || 'wellnest-7803a.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || 'wellnest-7803a',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || 'wellnest-7803a.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '215863511352',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '1:215863511352:web:323efeca132faa7ea919cd',
}

// ── Guard: prevent "Firebase app already exists" on Vite HMR ─────────────────
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// ✅ Auth
export const auth = getAuth(app)

// ── Firestore with full offline persistence ───────────────────────────────────
// persistentLocalCache + persistentMultipleTabManager gives us:
//   - Reads from IndexedDB when offline
//   - Writes queue in IndexedDB and auto-sync when back online
//   - Works across multiple browser tabs
let _db
try {
  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })
} catch {
  // initializeFirestore can only be called once — fall back on HMR re-execution
  _db = getFirestore(app)
}
export const db = _db

// ✅ Cloud Functions
export const functions = getFunctions(app)

// ── VAPID key (required for FCM) ──────────────────────────────────────────────
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
if (!VAPID_KEY) {
  console.warn(
    '[WellNest] ⚠️ VITE_FIREBASE_VAPID_KEY is not set. ' +
    'FCM push notifications will not work. Add it to your .env file.'
  )
}

// ── Messaging singleton ───────────────────────────────────────────────────────
let _messagingInstance = null
export const getMessagingInstance = async () => {
  if (_messagingInstance) return _messagingInstance
  try {
    const supported = await isSupported()
    if (supported) {
      _messagingInstance = getMessaging(app)
      return _messagingInstance
    }
    console.info('[WellNest] FCM not supported in this browser.')
  } catch (e) {
    console.warn('[WellNest] Firebase Messaging init error:', e.message)
  }
  return null
}

export default app