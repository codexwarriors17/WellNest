// public/firebase-messaging-sw.js
// ⚠️  Do NOT import ES modules here — service workers use importScripts only.
// 🔑  Placeholders below are replaced at build time by scripts/injectSwEnv.js
//     During development the hardcoded fallbacks are used automatically.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// ── Config ────────────────────────────────────────────────────────────────────
// Placeholders are replaced by `node scripts/injectSwEnv.js` after `vite build`.
// In local dev (vite dev), the hardcoded fallback values are used.
const firebaseConfig = {
  apiKey:            '__FIREBASE_API_KEY__'            || 'AIzaSyAEHEJpSd4nfs4eIUXZzX97pv4QN-RnJxQ',
  authDomain:        '__FIREBASE_AUTH_DOMAIN__'        || 'wellnest-7803a.firebaseapp.com',
  projectId:         '__FIREBASE_PROJECT_ID__'         || 'wellnest-7803a',
  storageBucket:     '__FIREBASE_STORAGE_BUCKET__'     || 'wellnest-7803a.firebasestorage.app',
  messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__'|| '215863511352',
  appId:             '__FIREBASE_APP_ID__'             || '1:215863511352:web:323efeca132faa7ea919cd',
}

// ── Guard: prevent double-init if SW is reloaded ─────────────────────────────
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

const messaging = firebase.messaging()

// ── Background message handler ────────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload)

  const { title, body, icon } = payload.notification || {}
  const type = payload.data?.type

  const notificationTitle = title || 'WellNest 🌿'
  const notificationOptions = {
    body:     body     || 'Check in with yourself today.',
    icon:     icon     || '/icons/icon-192.png',
    badge:    '/icons/icon-192.png',
    data:     payload.data || {},
    tag:      type     || 'wellnest',      // collapses duplicate notifications
    renotify: true,
    vibrate:  [200, 100, 200],
    actions: [
      { action: 'open',    title: '📊 Open App' },
      { action: 'dismiss', title: '✕ Dismiss'  },
    ],
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const type = event.notification.data?.type
  const urlMap = {
    mood_alert:     '/dashboard',
    daily_reminder: '/mood',
  }
  const targetPath = urlMap[type] || '/'
  const targetUrl  = self.location.origin + targetPath

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus + navigate it
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(targetUrl)
    })
  )
})

// ── SW lifecycle: skip waiting so updates apply immediately ──────────────────
self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))