// public/firebase-messaging-sw.js
// FCM Background Message Handler
// This SW is dedicated ONLY to FCM — it does NOT conflict with the VitePWA-generated sw.js
// because browsers register each SW at its own scope/path independently.
//
// 🔑 Placeholders below are replaced at build time by scripts/injectSwEnv.js
//    During `vite dev` the fallback hardcoded values are used.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// ── Firebase config (placeholders injected by injectSwEnv.js post-build) ─────
const firebaseConfig = {
  apiKey:            '__FIREBASE_API_KEY__'            !== '__FIREBASE_API_KEY__'            ? '__FIREBASE_API_KEY__'             : 'AIzaSyAEHEJpSd4nfs4eIUXZzX97pv4QN-RnJxQ',
  authDomain:        '__FIREBASE_AUTH_DOMAIN__'        !== '__FIREBASE_AUTH_DOMAIN__'        ? '__FIREBASE_AUTH_DOMAIN__'         : 'wellnest-7803a.firebaseapp.com',
  projectId:         '__FIREBASE_PROJECT_ID__'         !== '__FIREBASE_PROJECT_ID__'         ? '__FIREBASE_PROJECT_ID__'          : 'wellnest-7803a',
  storageBucket:     '__FIREBASE_STORAGE_BUCKET__'     !== '__FIREBASE_STORAGE_BUCKET__'     ? '__FIREBASE_STORAGE_BUCKET__'      : 'wellnest-7803a.firebasestorage.app',
  messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__'!== '__FIREBASE_MESSAGING_SENDER_ID__'? '__FIREBASE_MESSAGING_SENDER_ID__' : '215863511352',
  appId:             '__FIREBASE_APP_ID__'             !== '__FIREBASE_APP_ID__'             ? '__FIREBASE_APP_ID__'              : '1:215863511352:web:323efeca132faa7ea919cd',
}

// Guard: prevent duplicate app init on SW update/reload
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

const messaging = firebase.messaging()

// ── Background message → system notification ──────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Background message received:', payload)

  const { title, body, icon } = payload.notification || {}
  const type = payload.data?.type

  self.registration.showNotification(title || 'WellNest 🌿', {
    body:     body     || 'Check in with yourself today.',
    icon:     icon     || '/icons/icon-192.png',
    badge:    '/icons/icon-192.png',
    data:     payload.data || {},
    tag:      type     || 'wellnest',   // collapse duplicate notifications
    renotify: true,
    vibrate:  [200, 100, 200],
    actions: [
      { action: 'open',    title: '📊 Open App' },
      { action: 'dismiss', title: '✕ Dismiss'   },
    ],
  })
})

// ── Notification click → open correct route ───────────────────────────────────
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
      // Focus existing tab if app is already open
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Open new window
      if (clients.openWindow) return clients.openWindow(targetUrl)
    })
  )
})

// ── SW lifecycle ──────────────────────────────────────────────────────────────
// This FCM SW does NOT call skipWaiting() or clients.claim() — we let the
// browser manage it. The VitePWA sw.js handles its own lifecycle separately.
// This prevents a race condition where both SWs fight to claim clients.
self.addEventListener('install', () => {
  console.log('[FCM-SW] Installed')
  // Do NOT skipWaiting here — let FCM SW wait normally
})

self.addEventListener('activate', (event) => {
  console.log('[FCM-SW] Activated')
  // Do NOT call clients.claim() — VitePWA SW owns the fetch lifecycle
})