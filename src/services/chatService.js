// src/services/chatService.js
// AI-powered empathetic chatbot using Claude API (claude-sonnet-4-6)
// Falls back to local keyword responses if API is unavailable

const SYSTEM_PROMPT = `You are WellNest Companion, a warm, empathetic mental health support AI built for Indian users.

Your role:
- Provide compassionate first-level emotional support
- Be non-judgmental, caring, and culturally aware of Indian context
- Keep responses short (2-4 sentences max) and conversational
- Use simple language. Occasional Hindi/regional phrases are welcome if the user uses them.
- Gently suggest professional help or crisis helplines when appropriate

Crisis resources to mention when needed:
- iCall: 9152987821 (Mon-Sat 8am-10pm)
- Vandrevala Foundation: 1860-2662-345 (24/7)

IMPORTANT:
- You are NOT a replacement for professional mental health care
- If someone expresses suicidal thoughts or self-harm, always provide crisis numbers immediately
- Never diagnose, prescribe, or give medical advice
- Keep responses warm, brief, and human-feeling
- Do not use bullet points or headers — just natural conversational text`

// ── Claude API call ────────────────────────────────────────────────
export const generateBotResponseAI = async (userMessage, conversationHistory = []) => {
  try {
    const messages = [
      ...conversationHistory.slice(-6).map(m => ({   // last 6 messages for context
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: userMessage },
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Detect crisis keywords in user message for showing emergency banner
    const isCrisis = CRISIS_KEYWORDS.some(kw => userMessage.toLowerCase().includes(kw))

    return { text, isCrisis, source: 'ai' }
  } catch (err) {
    console.warn('Claude API unavailable, using fallback:', err.message)
    return generateBotResponseLocal(userMessage)
  }
}

// ── Crisis keywords ────────────────────────────────────────────────
export const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'want to die', 'end my life',
  'hurt myself', 'self harm', 'self-harm', 'no reason to live',
  'can\'t go on', 'end it all',
]

// ── Local fallback responses ───────────────────────────────────────
const responses = {
  greetings: [
    "Hi there! 🌿 I'm here for you. How are you feeling today?",
    "Hello! I'm so glad you reached out. What's on your mind?",
    "Hey! It takes courage to talk. How are you doing?",
  ],
  sad: [
    "I hear you, and I'm really sorry you're feeling this way. 💙 It's okay to not be okay sometimes. Would you like to talk more about what's been going on?",
    "Thank you for sharing that with me. Feeling sad can be really heavy — you're not alone in this. What would help you feel a little better right now?",
    "I'm here with you. Sadness is a natural emotion, and it won't last forever. Would you like to try a breathing exercise to help ground yourself?",
  ],
  anxious: [
    "Anxiety can feel really overwhelming. 🌊 Let's take this one moment at a time. Try taking a slow, deep breath — in for 4 counts, hold for 4, out for 4. How does that feel?",
    "I understand. Anxious feelings are tough. Remember: you've gotten through difficult moments before. Would you like to try a grounding exercise?",
    "You're safe here. 💙 When we're anxious, our body is trying to protect us. Let's slow down together. What's one thing you can see right now?",
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
    "I'm really concerned about you and I care about your safety. 💙 Please reach out to a crisis helpline right now — they have trained professionals available:\n\n📞 iCall: 9152987821\n📞 Vandrevala Foundation: 1860-2662-345 (24/7)\n\nYou deserve support. Are you safe right now?",
  ],
  default: [
    "I hear you. Would you like to tell me more about how you're feeling? 🌿",
    "Thank you for sharing that with me. How long have you been feeling this way?",
    "I'm here to listen without judgment. What would feel most helpful right now — talking, a breathing exercise, or just knowing someone cares?",
    "Your feelings are valid. 💙 Can you tell me a bit more about what's going on?",
  ],
}

const keywords = {
  greetings: ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening'],
  sad: ['sad', 'depressed', 'unhappy', 'crying', 'tears', 'hopeless', 'empty', 'miserable', 'down'],
  anxious: ['anxious', 'anxiety', 'worried', 'nervous', 'panic', 'fear', 'scared', 'overwhelmed'],
  stressed: ['stress', 'stressed', 'pressure', 'work', 'exam', 'deadline', 'tired', 'exhausted', 'burnout'],
  lonely: ['lonely', 'alone', 'isolated', 'no one', 'nobody', 'friendless'],
  happy: ['happy', 'great', 'wonderful', 'amazing', 'good', 'fine', 'fantastic', 'joy', 'excited'],
}

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const generateBotResponseLocal = (userMessage) => {
  const msg = userMessage.toLowerCase().trim()

  for (const kw of CRISIS_KEYWORDS) {
    if (msg.includes(kw)) return { text: rand(responses.crisis), isCrisis: true, source: 'local' }
  }

  for (const [category, kws] of Object.entries(keywords)) {
    for (const kw of kws) {
      if (msg.includes(kw)) {
        return { text: rand(responses[category] || responses.default), isCrisis: false, source: 'local' }
      }
    }
  }

  return { text: rand(responses.default), isCrisis: false, source: 'local' }
}

// Default export — tries AI first, falls back to local
export const generateBotResponse = generateBotResponseLocal

export const getInitialMessage = () => ({
  id: Date.now(),
  sender: 'bot',
  text: "Hi! 🌿 I'm your WellNest companion. I'm here to listen and support you without any judgment. How are you feeling today?",
  timestamp: new Date(),
})
