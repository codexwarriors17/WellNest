// src/components/Chatbot.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { generateBotResponseAI, getInitialMessage, CRISIS_KEYWORDS } from '../services/chatService'
import { saveChatMessage, getChatHistory } from '../firebase/firebaseFunctions'

// ── Emergency Panel ─────────────────────────────────────────────────────
const EmergencyPanel = ({ onClose }) => (
  <div className="mx-4 mb-3 animate-fade-up">
    <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center">
            <span className="text-base">🆘</span>
          </div>
          <div>
            <p className="font-bold text-rose-700 text-sm">Immediate Support Available</p>
            <p className="text-xs text-rose-500">Trained counsellors available now</p>
          </div>
        </div>
        <button onClick={onClose} className="text-rose-300 hover:text-rose-500 transition-colors p-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="space-y-2">
        <a href="tel:9152987821"
          className="flex items-center justify-between p-3 bg-white border border-rose-100 rounded-xl hover:bg-rose-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-sm">📞</div>
            <div>
              <div className="font-semibold text-rose-700 text-sm">iCall</div>
              <div className="text-xs text-rose-400">Mon–Sat, 8am–10pm</div>
            </div>
          </div>
          <div className="font-mono font-bold text-rose-600 text-sm group-hover:text-rose-700">9152987821</div>
        </a>

        <a href="tel:18602662345"
          className="flex items-center justify-between p-3 bg-white border border-rose-100 rounded-xl hover:bg-rose-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-sm">📞</div>
            <div>
              <div className="font-semibold text-rose-700 text-sm">Vandrevala Foundation</div>
              <div className="text-xs text-rose-400">24/7 — Always available</div>
            </div>
          </div>
          <div className="font-mono font-bold text-rose-600 text-sm group-hover:text-rose-700">1860-2662-345</div>
        </a>

        <a href="tel:9820466627"
          className="flex items-center justify-between p-3 bg-white border border-rose-100 rounded-xl hover:bg-rose-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-sm">📞</div>
            <div>
              <div className="font-semibold text-rose-700 text-sm">Aasra</div>
              <div className="text-xs text-rose-400">24/7 — Suicide prevention</div>
            </div>
          </div>
          <div className="font-mono font-bold text-rose-600 text-sm group-hover:text-rose-700">9820466627</div>
        </a>
      </div>

      <p className="text-xs text-rose-400 text-center mt-3">
        You deserve support. These calls are free and confidential.
      </p>
    </div>
  </div>
)

export default function Chatbot({ compact = false }) {
  const { user } = useAuth()
  const [messages,   setMessages]   = useState([getInitialMessage()])
  const [input,      setInput]      = useState('')
  const [isTyping,   setIsTyping]   = useState(false)
  const [showCrisis, setShowCrisis] = useState(false)
  const [usingAI,    setUsingAI]    = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, showCrisis])

  // ── Load chat history ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    setHistoryLoading(true)
    getChatHistory(user.uid, 20)
      .then(history => {
        if (history.length > 0) {
          const formatted = history.map(m => ({
            id:        m.id,
            sender:    m.sender,
            text:      m.text,
            timestamp: m.timestamp?.toDate?.() || new Date(),
          }))
          setMessages([getInitialMessage(), ...formatted])

          // Check last few messages for crisis keywords
          const lastUserMsg = history.filter(m => m.sender === 'user').slice(-1)[0]
          if (lastUserMsg) {
            const hasCrisis = CRISIS_KEYWORDS.some(kw =>
              lastUserMsg.text?.toLowerCase().includes(kw)
            )
            if (hasCrisis) setShowCrisis(true)
          }
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [user])

  // ── Send message ─────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    // Instant crisis check on user input
    const hasCrisis = CRISIS_KEYWORDS.some(kw => trimmed.toLowerCase().includes(kw))
    if (hasCrisis) setShowCrisis(true)

    const userMsg = {
      id:        Date.now(),
      sender:    'user',
      text:      trimmed,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Save user message to Firestore (non-blocking)
    if (user) {
      saveChatMessage(user.uid, { sender: 'user', text: trimmed }).catch(err => {
        console.warn('Failed to save user message:', err.message)
      })
    }

    // Natural typing delay
    await new Promise(r => setTimeout(r, 700 + Math.random() * 600))

    // Get bot response
    const conversationHistory = messages.filter((_, i) => i > 0) // exclude initial greeting
    const { text: botText, isCrisis, source } = await generateBotResponseAI(trimmed, conversationHistory)

    setUsingAI(source === 'ai')
    if (isCrisis) setShowCrisis(true)

    const botMsg = {
      id:        Date.now() + 1,
      sender:    'bot',
      text:      botText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, botMsg])
    setIsTyping(false)

    // Save bot message to Firestore (non-blocking)
    if (user) {
      saveChatMessage(user.uid, { sender: 'bot', text: botText }).catch(err => {
        console.warn('Failed to save bot message:', err.message)
      })
    }
  }, [messages, isTyping, user])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const QUICK_REPLIES = [
    "I'm feeling anxious",
    "I'm having a tough day",
    "I need to breathe",
    "Just here to talk",
  ]

  const showQuickReplies = messages.length <= 1
  const msgHeight = compact ? 'h-72' : 'h-[460px]'

  return (
    <div className="flex flex-col rounded-3xl overflow-hidden border border-slate-100 bg-slate-50"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

      {/* Header */}
      <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm">W</div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-800 text-sm">WellNest Companion</div>
          <div className="text-xs text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Online · Always here for you
          </div>
        </div>
        <div className="flex items-center gap-2">
          {usingAI && <span className="badge bg-violet-50 text-violet-600 text-[10px]">✨ AI</span>}
          <span className="badge bg-sky-50 text-sky-600">Support</span>
          <button onClick={() => setShowCrisis(true)}
            className="text-xs text-rose-400 hover:text-rose-600 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-rose-50">
            🆘 Help
          </button>
        </div>
      </div>

      {/* Crisis panel */}
      {showCrisis && <EmergencyPanel onClose={() => setShowCrisis(false)} />}

      {/* Messages */}
      <div className={`${msgHeight} overflow-y-auto px-4 py-4 space-y-4`}>

        {historyLoading && (
          <div className="flex justify-center py-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}
            style={{ animationDelay: `${i * 0.03}s` }}>
            {msg.sender === 'bot' && (
              <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl flex items-center justify-center text-sm mr-2 mt-auto flex-shrink-0">🌿</div>
            )}
            <div className={msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}>
              {msg.text.split('\n').map((line, j) => (
                <span key={j}>
                  {line}
                  {j < msg.text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Quick replies */}
        {showQuickReplies && (
          <div className="flex flex-wrap gap-2 animate-fade-up delay-300">
            {QUICK_REPLIES.map(reply => (
              <button key={reply} onClick={() => sendMessage(reply)}
                className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition-all font-medium">
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl flex items-center justify-center text-sm mr-2 flex-shrink-0">🌿</div>
            <div className="bubble-bot">
              <div className="flex gap-1 py-0.5">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-100 px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            rows={1}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-2xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:-translate-y-0.5 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Not a substitute for professional help ·{' '}
          <button onClick={() => setShowCrisis(true)} className="text-sky-500 hover:underline">Crisis resources</button>
        </p>
      </div>
    </div>
  )
}
