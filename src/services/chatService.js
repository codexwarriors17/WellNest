// src/services/chatService.js
// AI-powered empathetic chatbot responses + Firestore persistence

import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore"
import { auth, db } from "../firebase/firebaseConfig"

/**
 * Firestore structure:
 * chatMessages (collection)
 *  - uid: string
 *  - sender: "user" | "bot"
 *  - text: string
 *  - isCrisis: boolean
 *  - createdAt: serverTimestamp
 */

const responses = {
  greetings: [
    "Hi there! 🌿 I'm here for you. How are you feeling today?",
    "Hello! I'm so glad you reached out. What's on your mind?",
    "Hey! It takes courage to talk. How are you doing?",
  ],
  sad: [
    "I hear you, and I'm really sorry you're feeling this way. 💙 It's okay to not be okay sometimes. Would you like to talk more about what's been going on?",
    "Thank you for sharing that with me. Feeling sad can be really heavy. You're not alone in this. What would help you feel a little better right now?",
    "I'm here with you. Sadness is a natural emotion, and it won't last forever. Would you like to try a breathing exercise to help ground yourself?",
  ],
  anxious: [
    "Anxiety can feel really overwhelming. 🌊 Let's take this one moment at a time. Try taking a slow, deep breath with me — in for 4 counts, hold for 4, out for 4. How does that feel?",
    "I understand. Anxious feelings are tough. Remember: you've gotten through difficult moments before. Would you like to try a grounding exercise?",
    "You're safe here. When we're anxious, our body is trying to protect us. Let's slow down together. What's one thing you can see right now?",
  ],
  lonely: [
    "Loneliness is one of the hardest feelings to carry. 💛 I want you to know you're not alone — I'm here. Do you have anyone you can reach out to today, even just to say hi?",
    "Thank you for sharing that. It takes strength to admit loneliness. You matter, and your feelings matter. Is there one small thing that usually brings you comfort?",
  ],
  stressed: [
    "Sounds like you have a lot on your plate. 🌱 When we're stressed, it helps to break things down. What's the one thing weighing on you the most?",
    "Stress is your mind's way of saying it needs rest. Let's try to slow down — what's one thing you can let go of today?",
    "I hear you. Stress can feel like a wave that never stops. Let's breathe through it together first, then tackle things step by step.",
  ],
  happy: [
    "That's wonderful to hear! 🌟 Holding onto positive moments is so important. What made today special for you?",
    "I love hearing that! Joy is worth celebrating. What's been the highlight of your day?",
    "That's so great! Keep nurturing those good feelings. 😊",
  ],
  crisis: [
    "I'm really concerned about you and I care about your safety. 💙 Please reach out to a crisis helpline right now — they have trained professionals available 24/7:\n\n📞 iCall: 9152987821\n📞 Vandrevala Foundation: 1860-2662-345\n\nYou deserve support. Are you safe right now?",
  ],
  resources: [
    "Here are some resources that might help:\n\n🆘 **iCall Helpline**: 9152987821 (Mon-Sat, 8am-10pm)\n🆘 **Vandrevala Foundation**: 1860-2662-345 (24/7)\n\nWould you like me to suggest some self-help exercises?",
  ],
  default: [
    "I hear you. Would you like to tell me more about how you're feeling? 🌿",
    "Thank you for sharing that with me. How long have you been feeling this way?",
    "I'm here to listen without judgment. What would feel most helpful right now — talking, a breathing exercise, or just knowing someone cares?",
    "Your feelings are valid. 💙 Can you tell me a bit more about what's going on?",
  ],
}

const keywords = {
  greetings: ["hi", "hello", "hey", "namaste", "good morning", "good evening", "hola"],
  sad: ["sad", "depressed", "unhappy", "crying", "tears", "hopeless", "empty", "miserable", "down"],
  anxious: ["anxious", "anxiety", "worried", "nervous", "panic", "fear", "scared", "overwhelmed", "stressed out"],
  stressed: ["stress", "stressed", "pressure", "work", "exam", "deadline", "tired", "exhausted", "burned out", "burnout"],
  lonely: ["lonely", "alone", "isolated", "no one", "nobody", "friendless"],
  happy: ["happy", "great", "wonderful", "amazing", "good", "fine", "fantastic", "joy", "excited"],
  crisis: ["suicide", "kill myself", "want to die", "end my life", "hurt myself", "self harm", "self-harm"],
  resources: ["helpline", "therapist", "doctor", "help", "number", "resources", "support"],
}

const getRandomResponse = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const generateBotResponse = (userMessage) => {
  const msg = (userMessage || "").toLowerCase().trim()

  // Check for crisis keywords first
  for (const kw of keywords.crisis) {
    if (msg.includes(kw)) return { text: getRandomResponse(responses.crisis), isCrisis: true }
  }

  // Check other categories
  for (const [category, kws] of Object.entries(keywords)) {
    if (category === "crisis") continue
    for (const kw of kws) {
      if (msg.includes(kw)) {
        return { text: getRandomResponse(responses[category] || responses.default), isCrisis: false }
      }
    }
  }

  return { text: getRandomResponse(responses.default), isCrisis: false }
}

export const getInitialMessage = () => ({
  id: "init",
  sender: "bot",
  text: "Hi! 🌿 I'm your WellNest companion. I'm here to listen and support you without any judgment. How are you feeling today?",
  createdAt: new Date(),
  isCrisis: false,
})

/* -----------------------------
   Firestore helpers
-------------------------------- */

const requireUser = () => {
  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")
  return user
}

export const sendMessageToFirestore = async ({ text, sender = "user", isCrisis = false }) => {
  const user = requireUser()
  const clean = (text || "").trim()
  if (!clean) return

  await addDoc(collection(db, "chatMessages"), {
    uid: user.uid,
    sender, // "user" | "bot"
    text: clean,
    isCrisis,
    createdAt: serverTimestamp(),
  })
}

export const subscribeToUserChat = (callback, limitCount = 80) => {
  const user = requireUser()

  const q = query(
    collection(db, "chatMessages"),
    where("uid", "==", user.uid),
    orderBy("createdAt", "asc"),
    limit(limitCount)
  )

  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(msgs)
  })
}

/**
 * One-call function used by UI:
 * - Saves user message
 * - Generates bot response using your logic
 * - Saves bot message
 */
export const sendUserMessageWithBotReply = async (userText) => {
  await sendMessageToFirestore({ text: userText, sender: "user", isCrisis: false })

  const bot = generateBotResponse(userText)
  await sendMessageToFirestore({ text: bot.text, sender: "bot", isCrisis: bot.isCrisis })

  return bot
}