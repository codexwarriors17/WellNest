// src/sw.js
// WellNest App Service Worker (VitePWA injectManifest target)
// This is SEPARATE from public/firebase-messaging-sw.js (which handles FCM).
// VitePWA injects the precache manifest into this file at build time.

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'

// ── Precache all Vite-built assets ────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

// ── SPA navigation fallback ───────────────────────────────────────────────────
// Ensures React Router works offline — all nav requests serve index.html
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    // Don't intercept the FCM service worker registration request
    denylist: [/^\/firebase-messaging-sw\.js/],
  })
)

// ── Runtime: Firestore API ────────────────────────────────────────────────────
registerRoute(
  ({ url }) => url.origin === 'https://firestore.googleapis.com',
  new NetworkFirst({ cacheName: 'firestore-cache', networkTimeoutSeconds: 5 })
)

// ── Runtime: Google Fonts ─────────────────────────────────────────────────────
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts' })
)

// ── SW lifecycle ──────────────────────────────────────────────────────────────
self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))