# 🌿 WellNest — Mental Health Support App

A compassionate mental health companion for India. Built with React, Firebase, and love.

![WellNest](https://img.shields.io/badge/WellNest-Mental%20Health%20App-0ea5e9)

## Features

- 💬 **AI Chat Support** — Empathetic first-level support in multiple languages
- 📊 **Mood Tracker** — Log daily emotions with trend analysis
- 🧘 **Self-Help Tools** — Breathing exercises, journaling, and meditation
- 🔔 **Push Notifications** — Daily reminders via Firebase Cloud Messaging
- 🌍 **Multilingual** — English, Hindi (हिंदी), Marathi (मराठी), Tamil (தமிழ்)
- ⚡ **PWA** — Works offline as a Progressive Web App
- 🤖 **AI Mood Analysis** — Early intervention alerts from mood trends

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend | Firebase (Auth, Firestore, Functions, FCM) |
| Charts | Recharts |
| i18n | react-i18next |
| PWA | vite-plugin-pwa |

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-username/wellnest
cd wellnest
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** (Email/Password + Google)
4. Create a **Firestore** database
5. Enable **Cloud Messaging** and get your VAPID key
6. Deploy Firestore rules: `firebase deploy --only firestore:rules`

### 3. Environment Variables

```bash
cp .env.example .env.local
# Fill in your Firebase credentials
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Deploy Firebase Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 6. Build & Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── context/         # React Context (Auth)
├── firebase/        # Firebase config & functions
├── hooks/           # Custom hooks
├── pages/           # Route pages
├── routes/          # Router setup
├── services/        # Business logic
├── styles/          # Global CSS
└── utils/           # Helpers (i18n, dates)
functions/           # Firebase Cloud Functions
```

## Crisis Resources

If you or someone you know is in crisis:
- **iCall**: 9152987821 (Mon-Sat 8am-10pm)
- **Vandrevala Foundation**: 1860-2662-345 (24/7)
- **Aasra**: 9820466627 (24/7)

---

*WellNest is not a substitute for professional mental health care.*
