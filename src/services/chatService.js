// src/services/chatService.js
// Simple empathetic chatbot + Firestore persistence (safe JS, no JSX)

import { db } from '../firebase/firebaseConfig'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

// ✅ Exported for Chatbot.jsx imports
export const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end it',
  'self harm',
  'self-harm',
  'hurt myself',
  'i want to die',
  'want to die',
  'die',
]

// ✅ Exported for Chatbot.jsx imports
export function getInitialMessage() {
  return (
    "Hi, I'm WellNest. I'm here to listen. " +
    "How are you feeling right now? You can share as much or as little as you want."
  )
}

const FALLBACK_REPLIES = [
  "I hear you. Want to tell me a bit more about what's been going on?",
  "That sounds really heavy. I'm here with you — what feels hardest right now?",
  "Thanks for sharing that. Would you like a small step you can try today?",
  "I'm glad you said that out loud. What kind of support would help most right now?",
]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function isCrisisText(text) {
  const t = String(text || '').toLowerCase()
  return CRISIS_KEYWORDS.some((w) => t.includes(w))
}

/**
 * Rule-based bot reply (demo-safe).
 */
export function generateBotReply(userText = '') {
  const text = String(userText || '').toLowerCase().trim()

  if (isCrisisText(text)) {
    return (
      "I'm really sorry you're feeling this way. You deserve immediate support. " +
      "If you're in danger right now, please call your local emergency number. " +
      "In India, you can call 112. You can also reach AASRA: 91-22-27546669."
    )
  }

  if (text.includes('anx') || text.includes('panic') || text.includes('stress')) {
    return "That sounds like a lot. Want to try a quick grounding exercise? Inhale 4, hold 2, exhale 6 — repeat 3 times."
  }

  if (text.includes('sad') || text.includes('down') || text.includes('depress')) {
    return "I'm sorry you're feeling low. What’s one small thing that usually gives you comfort — music, a walk, talking to someone?"
  }

  if (text.includes('angry') || text.includes('frustrat') || text.includes('irritat')) {
    return "It makes sense to feel that way. What triggered it — and what would feel like relief right now?"
  }

  if (text.includes('sleep') || text.includes('insomnia') || text.includes('tired')) {
    return "Sleep issues can really affect everything. Want a tiny routine tonight: dim lights 30 mins before bed + no phone in bed + slow breathing?"
  }

  return pickRandom(FALLBACK_REPLIES)
}

/**
 * ✅ Compatibility export:
 * Some components expect generateBotResponseAI().
 * For now it uses the same rule-based generator.
 * Later you can swap this to a real AI API call.
 */
export async function generateBotResponseAI(userText = '') {
  return generateBotReply(userText)
}

/**
 * Save a chat message to Firestore.
 */
export async function saveChatMessage({ uid, role, text }) {
  if (!uid) throw new Error('Missing uid')
  if (!role) throw new Error('Missing role')
  if (!text) throw new Error('Missing text')

  const ref = collection(db, 'users', uid, 'chatMessages')
  await addDoc(ref, {
    role,
    text,
    createdAt: serverTimestamp(),
  })
}

/**
 * 1) save user message
 * 2) generate reply
 * 3) save reply
 * 4) return reply
 */
export async function sendChatMessage({ uid, text }) {
  const userText = String(text || '').trim()
  if (!userText) return ''

  await saveChatMessage({ uid, role: 'user', text: userText })

  const reply = await generateBotResponseAI(userText)

  await saveChatMessage({ uid, role: 'bot', text: reply })

  return reply
}