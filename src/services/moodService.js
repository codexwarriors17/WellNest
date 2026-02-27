// src/services/moodService.js
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

export const MOODS = [
  { id: "great", emoji: "😄", label: "Great", value: 5, color: "#22c55e" },
  { id: "good", emoji: "🙂", label: "Good", value: 4, color: "#0ea5e9" },
  { id: "neutral", emoji: "😐", label: "Okay", value: 3, color: "#f59e0b" },
  { id: "sad", emoji: "😔", label: "Sad", value: 2, color: "#6366f1" },
  { id: "terrible", emoji: "😢", label: "Terrible", value: 1, color: "#f43f5e" }
];

export const getMoodById = (id) => MOODS.find((m) => m.id === id);
export const getMoodEmoji = (id) => getMoodById(id)?.emoji ?? "😐";
export const getMoodValue = (id) => getMoodById(id)?.value ?? 3;
export const getMoodColor = (id) => {
  const mood = getMoodById(id)
  return mood ? mood.color : '#0ea5e9'
}
// ✅ SAVE mood log to Firestore
export const logMood = async ({ mood, note = "" }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  await addDoc(collection(db, "moodLogs"), {
    uid: user.uid,
    mood,         // "great" | "good" | ...
    note,
    createdAt: serverTimestamp(),
  });
};

// ✅ FETCH moods for current user
export const getUserMoodLogs = async (limitCount = 30) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const q = query(
    collection(db, "moodLogs"),
    where("uid", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return logs.slice(0, limitCount);
};

// ✅ PREPARE chart data
export const prepareMoodChartData = (logs, days = 14) => {
  return (logs || [])
    .slice(0, days)
    .reverse()
    .map((log) => {
      const dt = log.createdAt?.toDate?.() ? log.createdAt.toDate() : null;

      return {
        date: dt
          ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(dt)
          : "N/A",
        value: getMoodValue(log.mood),
        mood: log.mood,
        emoji: getMoodEmoji(log.mood),
      };
      
    });
};