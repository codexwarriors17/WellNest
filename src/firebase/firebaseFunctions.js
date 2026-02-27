// src/firebase/firebaseFunctions.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import {
  doc, setDoc, getDoc, updateDoc, collection,
  addDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, deleteDoc, increment
} from 'firebase/firestore'
import { auth, db } from './firebaseConfig'

const googleProvider = new GoogleAuthProvider()

// ── AUTH ──────────────────────────────────────────────

export const registerWithEmail = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  await createUserProfile(cred.user, { displayName, language: 'en' })
  return cred.user
}

export const loginWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password)
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

// ── ANONYMOUS LOGIN ───────────────────────────────────

export const loginAnonymously = async () => {
  const cred = await signInAnonymously(auth)
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    email: null,
    displayName: 'Guest',
    isAnonymous: true,
    createdAt: serverTimestamp(),
    streak: 0,
    totalLogs: 0,
    positiveDays: 0,
    language: 'en',
  }, { merge: true })
  return cred.user
}

export const linkAnonWithEmail = async (email, password, displayName) => {
  const credential = EmailAuthProvider.credential(email, password)
  const cred = await linkWithCredential(auth.currentUser, credential)
  await updateProfile(cred.user, { displayName })
  await updateDoc(doc(db, 'users', cred.user.uid), {
    email,
    displayName,
    isAnonymous: false,
    updatedAt: serverTimestamp(),
  })
  return cred.user
}

export const linkAnonWithGoogle = async () => {
  const cred = await linkWithPopup(auth.currentUser, googleProvider)
  await updateDoc(doc(db, 'users', cred.user.uid), {
    email: cred.user.email,
    displayName: cred.user.displayName,
    photoURL: cred.user.photoURL,
    isAnonymous: false,
    updatedAt: serverTimestamp(),
  })
  return cred.user
}

export const logout = () => signOut(auth)
export const resetPassword = (email) => sendPasswordResetEmail(auth, email)

// ── USER PROFILE ──────────────────────────────────────

export const createUserProfile = async (user, extra = {}) => {
  await setDoc(doc(db, 'users', user.uid), {
    uid:         user.uid,
    email:       user.email || null,
    displayName: user.displayName || extra.displayName || 'User',
    photoURL:    user.photoURL || null,
    isAnonymous: false,
    onboarded:   false,
    streak:      0,
    totalLogs:   0,
    positiveDays: 0,
    loggedAfterBadDay: false,
    createdAt:   serverTimestamp(),
    language:    extra.language || 'en',
    ...extra,
  }, { merge: true })
}

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() })
}

// ── MOOD LOGS ─────────────────────────────────────────

export const saveMoodLog = async (uid, moodData) => {
  // 1. Save the log
  const ref = await addDoc(collection(db, 'moodLogs'), {
    uid,
    ...moodData,
    timestamp: serverTimestamp(),
  })

  // 2. Update user stats atomically
  const userRef  = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return ref.id

  const data    = userSnap.data()
  const today   = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // Streak logic
  let newStreak = 1
  if (data.lastLogDate === yesterday) {
    newStreak = (data.streak || 0) + 1
  } else if (data.lastLogDate === today) {
    newStreak = data.streak || 1  // already logged today, keep streak
  }

  // Badge stats
  const isPositive = ['great', 'good'].includes(moodData.mood)
  const prevMoodWasBad = data.lastMood === 'terrible'
  const loggedAfterBadDay = prevMoodWasBad && moodData.mood !== 'terrible'

  await updateDoc(userRef, {
    totalLogs:    increment(1),
    streak:       newStreak,
    lastLogDate:  today,
    lastMood:     moodData.mood,
    ...(isPositive && { positiveDays: increment(1) }),
    ...(loggedAfterBadDay && { loggedAfterBadDay: true }),
    updatedAt:    serverTimestamp(),
  })

  return ref.id
}

export const getMoodLogs = async (uid, days = 30) => {
  const q = query(
    collection(db, 'moodLogs'),
    where('uid', '==', uid),
    orderBy('timestamp', 'desc'),
    limit(days)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const deleteMoodLog = async (logId) => {
  await deleteDoc(doc(db, 'moodLogs', logId))
}

// ── CHAT HISTORY ──────────────────────────────────────

export const saveChatMessage = async (uid, message) => {
  await addDoc(collection(db, 'chatHistory'), {
    uid,
    ...message,
    timestamp: serverTimestamp(),
  })
}

export const getChatHistory = async (uid, limitCount = 50) => {
  const q = query(
    collection(db, 'chatHistory'),
    where('uid', '==', uid),
    orderBy('timestamp', 'asc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── MOOD ANALYSIS ─────────────────────────────────────

export const analyzeMoodTrend = (logs) => {
  if (!logs || logs.length < 2) {
    return {
      status: 'insufficient_data',
      message: 'Log at least 2 moods to see your trend analysis.',
      avg: null,
      alert: false,
    }
  }

  const moodValues = { terrible: 1, sad: 2, neutral: 3, good: 4, great: 5 }
  const recent = logs.slice(0, 7)
  const scores = recent.map(l => moodValues[l.mood] || 3)
  const avg = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))

  if (avg >= 4.0) return {
    status: 'positive', avg,
    message: `You've been feeling great lately! Keep nurturing these positive moments. 🌟`,
    alert: false,
  }
  if (avg >= 3.0) return {
    status: 'normal', avg,
    message: `Your mood has been balanced overall. Small self-care steps can help maintain this. 💙`,
    alert: false,
  }
  if (avg >= 2.0) return {
    status: 'concerning', avg,
    message: `You've been going through a tough stretch. Consider reaching out to someone you trust. 💛`,
    alert: false,
  }
  return {
    status: 'critical', avg,
    message: `You've been struggling recently. You deserve support — please reach out to a helpline or trusted person. 💙`,
    alert: true,
  }
}
