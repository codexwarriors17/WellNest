// scripts/injectSwEnv.js
// Run after `vite build` to inject Firebase env vars into the SW.
// Add to package.json: "build": "vite build && node scripts/injectSwEnv.js"

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const swPath = resolve(__dirname, '../dist/firebase-messaging-sw.js')

try {
  let sw = readFileSync(swPath, 'utf8')

  const replacements = {
    '__FIREBASE_API_KEY__':            process.env.VITE_FIREBASE_API_KEY            || '',
    '__FIREBASE_AUTH_DOMAIN__':        process.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
    '__FIREBASE_PROJECT_ID__':         process.env.VITE_FIREBASE_PROJECT_ID         || '',
    '__FIREBASE_STORAGE_BUCKET__':     process.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
    '__FIREBASE_MESSAGING_SENDER_ID__':process.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '',
    '__FIREBASE_APP_ID__':             process.env.VITE_FIREBASE_APP_ID             || '',
  }

  for (const [placeholder, value] of Object.entries(replacements)) {
    sw = sw.replaceAll(placeholder, value)
  }

  writeFileSync(swPath, sw)
  console.log('✅ Firebase config injected into firebase-messaging-sw.js')
} catch (e) {
  console.warn('⚠️  Could not inject SW env (run after build):', e.message)
}
