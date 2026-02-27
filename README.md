# 🌿 WellNest — Mental Health Support PWA

A hackathon-ready mental wellness app built for India. Free, multilingual, always available.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env   # credentials already pre-filled for wellnest-7803a
npm run dev            # → http://localhost:5173
```

## 🔔 FCM Setup (Push Notifications)

1. Go to [Firebase Console](https://console.firebase.google.com) → wellnest-7803a
2. **Project Settings → Cloud Messaging → Web Push certificates**
3. Click **Generate key pair** → copy the key
4. Add to `.env`:
   ```
   VITE_FIREBASE_VAPID_KEY=your_key_here
   ```

## 🔥 Firebase Services to Enable

In Firebase Console:
- **Authentication** → Sign-in methods → Enable: Email/Password, Google, Anonymous
- **Firestore Database** → Create database (production mode)
- **Cloud Messaging** → Enabled automatically when you generate VAPID key

## 📦 Deploy

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules    # deploy security rules
npm run build                              # build + inject SW env vars
firebase deploy --only hosting            # deploy frontend
firebase deploy --only functions          # deploy cloud functions
```

## 🏗️ Project Structure

```
src/
├── components/         Reusable UI (Navbar, MoodTracker, Chatbot, Badges)
├── context/            AuthContext — global auth state
├── firebase/           firebaseConfig, firebaseFunctions, firebaseMessaging
├── hooks/              useFCM — push notification hook
├── pages/              All route pages
├── routes/             AppRouter with protected routes
├── services/           moodService, chatService, exportService
├── styles/             global.css (Tailwind + custom classes)
└── utils/              dateUtils, i18n

public/
└── firebase-messaging-sw.js   ← FCM service worker (background push)

functions/
└── index.js            Cloud Functions: mood alerts + daily reminders
```

## 🌐 Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Guest only | Auth page |
| `/chat` | Public | AI chat support |
| `/selfhelp` | Public | Breathing, yoga, journal |
| `/dashboard` | Protected | Mood chart, badges, quick actions |
| `/mood` | Protected | Full mood tracker + history |
| `/profile` | Protected | Profile, settings, notifications |
| `/community` | Protected | Anonymous community posts |
| `/admin` | Admin only | User stats dashboard |

## 🆘 Crisis Helplines (India)

- **iCall**: 9152987821 (Mon–Sat, 8am–10pm)
- **Vandrevala Foundation**: 1860-2662-345 (24/7)
- **Aasra**: 9820466627 (24/7)
