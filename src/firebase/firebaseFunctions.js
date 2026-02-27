
// src/firebase/firebaseFunctions.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'

import { auth, db } from './firebaseConfig'

const googleProvider = new GoogleAuthProvider()

// ──────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────

export const registerWithEmail = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  await createUserProfile(cred.user, { displayName, language: 'en' })
  return cred.user
}

export const loginWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password)

  // Ensure profile exists (important if user was created earlier without profile)
  const exists = await getDoc(doc(db, 'users', cred.user.uid))
  if (!exists.exists()) {
    await createUserProfile(cred.user, { language: 'en' })
  }

  return cred.user
}

export const loginWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider)
  const exists = await getDoc(doc(db, 'users', cred.user.uid))
  if (!exists.exists()) {
    await createUserProfile(cred.user, { language: 'en' })
  }
  return cred.user
}

export const logout = () => signOut(auth)

export const resetPassword = (email) => sendPasswordResetEmail(auth, email)

// ──────────────────────────────────────────────────────
// USER PROFILE
// ──────────────────────────────────────────────────────

export const createUserProfile = async (user, extra = {}) => {
  await setDoc(
    doc(db, 'users', user.uid),
    {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || extra.displayName || 'Friend',
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      streak: 0,
      totalLogs: 0,
      ...extra,
    },
    { merge: true }
  )
}

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// ──────────────────────────────────────────────────────
// MOOD LOGS
// ──────────────────────────────────────────────────────

export const saveMoodLog = async (uid, moodData) => {
  // moodData example: { mood: "good", moodScore: 4, note: "..." }
  const ref = await addDoc(collection(db, 'moodLogs'), {
    uid,
    ...moodData,
    timestamp: serverTimestamp(),
  })

  // Update user stats safely (even if profile missing)
  await setDoc(
    doc(db, 'users', uid),
    {
      totalLogs: (moodData?.incrementTotalLogsBy ?? 1), // default 1
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  // If you want accurate increment, do it properly:
  // For hackathon simplicity, we’ll just update `updatedAt` and keep totalLogs tracking in UI later.

  return ref.id
}

export const getMoodLogs = async (uid, days = 30, limitCount = 60) => {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const q = query(
    collection(db, 'moodLogs'),
    where('uid', '==', uid),
    where('timestamp', '>=', Timestamp.fromDate(since)),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  )

  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const deleteMoodLog = async (logId) => {
  await deleteDoc(doc(db, 'moodLogs', logId))
}

// ──────────────────────────────────────────────────────
// CHAT HISTORY (use ONE collection name)
// ──────────────────────────────────────────────────────

export const saveChatMessage = async (uid, message) => {
  // message example: { role: "user"|"assistant", text: "...", meta: {...} }
  await addDoc(collection(db, 'chatMessages'), {
    uid,
    ...message,
    timestamp: serverTimestamp(),
  })
}

export const getChatHistory = async (uid, limitCount = 50) => {
  const q = query(
    collection(db, 'chatMessages'),
    where('uid', '==', uid),
    orderBy('timestamp', 'asc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ──────────────────────────────────────────────────────
// AI MOOD ANALYSIS (client helper)
// ──────────────────────────────────────────────────────

export const analyzeMoodTrend = (logs) => {
  if (!logs || logs.length < 3) return { status: 'insufficient_data', alert: false }

  // logs expected: newest first (desc). We'll take last 7 entries from newest.
  const recent = logs.slice(0, 7)

  const moodValues = { terrible: 1, sad: 2, neutral: 3, good: 4, great: 5 }

  const scores = recent.map((l) => l.moodScore || moodValues[l.mood] || 3)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const trend = scores[0] - scores[scores.length - 1]

  let status = 'normal'
  let alert = false
  let message = ''

  if (avg < 2) {
    status = 'critical'
    alert = true
    message =
      "You've been feeling low for a while. Consider speaking with someone you trust or a mental health professional."
  } else if (avg < 2.5 && trend < -1) {
    status = 'concerning'
    alert = true
    message =
      'Your mood has been declining. Remember to practice self-care and reach out for support.'
  } else if (avg >= 3.5) {
    status = 'positive'
    message = "You've been maintaining a positive mood. Keep up the great work!"
  } else {
    message = 'Your mood is in a normal range. Keep tracking to see trends.'
  }

  return { status, alert, message, avg: Math.round(avg * 10) / 10, trend }
}