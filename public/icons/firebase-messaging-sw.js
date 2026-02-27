// public/firebase-messaging-sw.js
// This file MUST be in /public so it's served at the root scope.
// It enables FCM background (push) notifications when the app tab is closed/hidden.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// ── Firebase config (must match your .env values) ──────────────────────────
// These are intentionally hardcoded here because service workers cannot read
// Vite env variables. This file is public — never put secrets here.
// Only the messaging-related fields are strictly required.
firebase.initializeApp({
  apiKey:            self.__FIREBASE_API_KEY__            || "YOUR_API_KEY",
  authDomain:        self.__FIREBASE_AUTH_DOMAIN__        || "YOUR_AUTH_DOMAIN",
  projectId:         self.__FIREBASE_PROJECT_ID__         || "YOUR_PROJECT_ID",
  storageBucket:     self.__FIREBASE_STORAGE_BUCKET__     || "YOUR_STORAGE_BUCKET",
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__|| "YOUR_SENDER_ID",
  appId:             self.__FIREBASE_APP_ID__             || "YOUR_APP_ID",
})

const messaging = firebase.messaging()

// ── Background message handler ─────────────────────────────────────────────
// Fires when a push arrives and the app is in the background or closed.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message received:', payload)

  const { title, body, icon } = payload.notification || {}
  const notifTitle = title || 'WellNest 🌿'
  const notifOptions = {
    body:  body  || 'Check in with yourself today.',
    icon:  icon  || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data:  payload.data || {},
    actions: [
      { action: 'open',    title: '📊 Open App' },
      { action: 'dismiss', title: 'Dismiss'     },
    ],
    tag:   payload.data?.type || 'wellnest-default', // collapses duplicate notifications
    renotify: true,
    vibrate: [200, 100, 200],
  }

  self.registration.showNotification(notifTitle, notifOptions)
})

// ── Notification click handler ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  // Route to relevant page based on notification type
  const type = event.notification.data?.type
  const urlMap = {
    mood_alert:      '/dashboard',
    daily_reminder:  '/mood',
  }
  const targetUrl = urlMap[type] || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
