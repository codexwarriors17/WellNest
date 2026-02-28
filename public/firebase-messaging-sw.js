// public/firebase-messaging-sw.js
// Required for FCM — must be at root scope

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            "AIzaSyAEHEJpSd4nfs4eIUXZzX97pv4QN-RnJxQ",
  authDomain:        "wellnest-7803a.firebaseapp.com",
  projectId:         "wellnest-7803a",
  storageBucket:     "wellnest-7803a.firebasestorage.app",
  messagingSenderId: "215863511352",
  appId:             "1:215863511352:web:323efeca132faa7ea919cd",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload)
  const { title, body, icon } = payload.notification || {}
  const type = payload.data?.type

  self.registration.showNotification(title || 'WellNest 🌿', {
    body:     body  || 'Check in with yourself today.',
    icon:     icon  || '/icons/icon-192.png',
    badge:    '/icons/icon-192.png',
    data:     payload.data || {},
    tag:      type || 'wellnest',
    renotify: true,
    vibrate:  [200, 100, 200],
    actions: [
      { action: 'open',    title: '📊 Open App' },
      { action: 'dismiss', title: 'Dismiss'     },
    ],
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const type = event.notification.data?.type
  const urlMap = { mood_alert: '/dashboard', daily_reminder: '/mood' }
  const targetUrl = urlMap[type] || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl)
    })
  )
})
