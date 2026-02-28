// src/services/moodService.js
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore"
import { auth, db } from "../firebase/firebaseConfig"

export const MOODS = [
  { id: "great", emoji: "😄", label: "Great", color: "#22c55e", value: 5 },
  { id: "good", emoji: "🙂", label: "Good", color: "#0ea5e9", value: 4 },
  { id: "neutral", emoji: "😐", label: "Okay", color: "#f59e0b", value: 3 },
  { id: "sad", emoji: "😔", label: "Sad", color: "#6366f1", value: 2 },
  { id: "terrible", emoji: "😢", label: "Terrible", color: "#f43f5e", value: 1 },
]

export const getMoodById = (id) => MOODS.find((m) => m.id === id)
export const getMoodEmoji = (id) => getMoodById(id)?.emoji ?? "😐"
export const getMoodValue = (id) => getMoodById(id)?.value ?? 3
export const getMoodColor = (id) => getMoodById(id)?.color ?? "#0ea5e9" // ✅ FIXED EXPORT

const requireUser = () => {
  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")
  return user
}

// ✅ Save mood log (History list)
export const logMood = async ({ mood, note = "" }) => {
  const user = requireUser()
  await addDoc(collection(db, "moodLogs"), {
    uid: user.uid,
    mood,
    note,
    createdAt: serverTimestamp(),
  })
}

// ✅ Fetch ONLY current user's logs (with timestamps)
export const getUserMoodLogs = async (limitCount = 30) => {
  const user = requireUser()

  const q = query(
    collection(db, "moodLogs"),
    where("uid", "==", user.uid), // ✅ IMPORTANT
    orderBy("createdAt", "desc")
  )

  const snap = await getDocs(q)
  const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return logs.slice(0, limitCount)
}

// ✅ Chart data: last N logs → date + value
export const prepareMoodChartData = (logs, days = 14) => {
  return (logs || [])
    .slice(0, days)
    .reverse()
    .map((log) => {
      const dt = log.createdAt?.toDate?.() ? log.createdAt.toDate() : null
      return {
        date: dt
          ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(dt)
          : "N/A",
        value: getMoodValue(log.mood),
        mood: log.mood,
        emoji: getMoodEmoji(log.mood),
        color: getMoodColor(log.mood),
      }
    })
}