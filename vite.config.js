// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // generateSW mode: Workbox generates the caching SW automatically.
      // The FCM SW (firebase-messaging-sw.js) lives separately — no conflict.
      strategies: 'generateSW',
      registerType: 'prompt',           // prompt = we control the update UX ourselves
      injectRegister: 'script',         // inject <script> registration into index.html

      // ── Manifest ─────────────────────────────────────────────────────────
      includeAssets: ['icons/favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'offline.html'],
      manifest: {
        name:             'WellNest — Mental Health Support',
        short_name:       'WellNest',
        description:      'Your private mental wellness companion. Mood tracking, AI chat support, and self-help tools.',
        theme_color:      '#0ea5e9',
        background_color: '#f0f9ff',
        display:          'standalone',
        orientation:      'portrait-primary',
        start_url:        '/?source=pwa',
        scope:            '/',
        lang:             'en',
        categories:       ['health', 'lifestyle', 'medical'],
        icons: [
          {
            src:     '/icons/icon-192.png',
            sizes:   '192x192',
            type:    'image/png',
            purpose: 'any',
          },
          {
            src:     '/icons/icon-512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'any',
          },
          {
            // maskable = safe zone icon for adaptive icons on Android
            src:     '/icons/icon-512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name:       'Log Mood',
            short_name: 'Mood',
            url:        '/mood?source=shortcut',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name:       'Dashboard',
            short_name: 'Dashboard',
            url:        '/dashboard?source=shortcut',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },

      // ── Workbox (SW generation) ───────────────────────────────────────────
      workbox: {
        // Precache everything Vite builds
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],

        // ── CRITICAL: Exclude FCM SW from being intercepted ───────────────
        // If Workbox tries to cache the FCM SW itself, things break.
        navigateFallbackDenylist: [
          /^\/firebase-messaging-sw\.js/,
          /^\/api\//,
        ],

        // SPA fallback: serve index.html for all navigation requests
        // This makes the app openable offline (shows cached shell)
        navigateFallback: '/index.html',

        // App shell caching — these are always available offline
        // (Workbox precaches all globPatterns above, so this is extra safety)
        runtimeCaching: [
          // ── Google Fonts (stylesheet) ────────────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler:    'CacheFirst',
            options: {
              cacheName:  'google-fonts-stylesheets',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // ── Google Fonts (actual font files) ─────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler:    'CacheFirst',
            options: {
              cacheName:  'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // ── Firebase Auth (needed for session restore) ────────────────────
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler:    'NetworkFirst',
            options: {
              cacheName:            'firebase-auth',
              networkTimeoutSeconds: 5,
              expiration:           { maxEntries: 10, maxAgeSeconds: 60 * 60 },
            },
          },
          // ── Firestore REST API ────────────────────────────────────────────
          // NetworkFirst: try live data, fall back to IndexedDB-cached Firestore
          // Note: Firestore SDK handles its own offline via IndexedDB — this
          // just caches the REST calls as a secondary layer.
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler:    'NetworkFirst',
            options: {
              cacheName:            'firestore-cache',
              networkTimeoutSeconds: 5,
              expiration:           { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse:    { statuses: [0, 200] },
            },
          },
          // ── FCM / Firebase Messaging ──────────────────────────────────────
          {
            urlPattern: /^https:\/\/fcm\.googleapis\.com\/.*/i,
            handler:    'NetworkOnly',  // Never cache push — always live
          },
          // ── App icons / static images ─────────────────────────────────────
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler:    'CacheFirst',
            options: {
              cacheName:  'images-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],

        // Clean up old caches on SW activation
        cleanupOutdatedCaches: true,

        // Skip waiting so updates activate immediately after user confirmation
        // (we control this via the InstallPrompt / update banner)
        skipWaiting: false,
        clientsClaim: true,
      },

      // Disable PWA SW in dev — avoids HMR conflicts
      devOptions: {
        enabled: false,
      },
    }),
  ],
})