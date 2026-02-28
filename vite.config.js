// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Use 'injectManifest' so Vite doesn't auto-generate its own sw.js
      // and doesn't conflict with firebase-messaging-sw.js
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',                 // Our custom app SW (separate from FCM SW)
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name:             'WellNest - Mental Health Support',
        short_name:       'WellNest',
        description:      'Your mental wellness companion',
        theme_color:      '#0ea5e9',
        background_color: '#f0f9ff',
        display:          'standalone',
        start_url:        '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Prevent the VitePWA workbox SW from intercepting or controlling
        // firebase-messaging-sw.js itself
        navigateFallbackDenylist: [/^\/firebase-messaging-sw\.js/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler:    'NetworkFirst',
            options:    { cacheName: 'firestore-cache', networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler:    'StaleWhileRevalidate',
            options:    { cacheName: 'google-fonts-stylesheets' },
          },
        ],
      },
      // Do NOT touch firebase-messaging-sw.js — FCM manages it independently
      devOptions: {
        enabled: false, // Disable PWA SW in dev to avoid conflicts with HMR
      },
    }),
  ],
})