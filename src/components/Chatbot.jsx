// src/components/Chatbot.jsx
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { generateBotResponse, getInitialMessage } from '../services/chatService'
import { saveChatMessage, getChatHistory } from '../firebase/firebaseFunctions'

const EmergencyBanner = ({ onClose }) => (
  <div className="crisis-banner mx-4 mb-3 animate-fade-up">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className="font-bold text-rose-700 text-sm mb-2">🆘 Immediate Support Available</p>
        <div className="space-y-1">
          <a href="tel:9152987821" className="flex items-center gap-2 text-xs text-rose-600 hover:text-rose-800 font-semibold">
            <span className="bg-rose-100 px-2 py-0.5 rounded-lg">📞 iCall: 9152987821</span>
            <span className="text-rose-400">Mon-Sat 8am-10pm</span>
          </a>
          <a href="tel:18602662345" className="flex items-center gap-2 text-xs text-rose-600 hover:text-rose-800 font-semibold">
            <span className="bg-rose-100 px-2 py-0.5 rounded-lg">📞 Vandrevala: 1860-2662-345</span>
            <span className="text-rose-400">24/7</span>
          </a>
        </div>
      </div>
      <button onClick={onClose} className="text-rose-300 hover:text-rose-500 p-1 text-lg leading-none">✕</button>
    </div>
  </div>
)

export default function Chatbot({ compact = false }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([getInitialMessage()])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showCrisis, setShowCrisis] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (user) {
      getChatHistory(user.uid, 20).then(history => {
        if (history.length > 0) {
          const formatted = history.map(m => ({ id: m.id, sender: m.sender, text: m.text, timestamp: m.timestamp?.toDate?.() || new Date() }))
          setMessages([getInitialMessage(), ...formatted])
        }
      }).catch(() => {})
    }
  }, [user])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { id: Date.now(), sender: 'user', text: text.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    if (user) saveChatMessage(user.uid, { sender: 'user', text: text.trim() }).catch(() => {})

    await new Promise(r => setTimeout(r, 900 + Math.random() * 700))
    const { text: botText, isCrisis } = generateBotResponse(text)
    if (isCrisis) setShowCrisis(true)
    const botMsg = { id: Date.now() + 1, sender: 'bot', text: botText, timestamp: new Date() }
    setMessages(prev => [...prev, botMsg])
    setIsTyping(false)
    if (user) saveChatMessage(user.uid, { sender: 'bot', text: botText }).catch(() => {})
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const QUICK_REPLIES = ["I'm feeling anxious", "I'm having a tough day", "I need to breathe", "Just here to talk"]
  const showQuickReplies = messages.length <= 1

  const msgHeight = compact ? 'h-72' : 'h-[460px]'

  return (
    <div className="flex flex-col rounded-3xl overflow-hidden border border-slate-100 bg-slate-50" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

      {/* Header */}
      <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm">W</div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-800 text-sm">WellNest Companion</div>
          <div className="text-xs text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online · Always here for you
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-sky-50 text-sky-600">AI Support</span>
          <button onClick={() => setShowCrisis(true)} className="text-xs text-rose-400 hover:text-rose-600 font-medium transition-colors">🆘 Help</button>
        </div>
      </div>

      {/* Crisis banner */}
      {showCrisis && <EmergencyBanner onClose={() => setShowCrisis(false)} />}

      {/* Messages */}
      <div className={`${msgHeight} overflow-y-auto px-4 py-4 space-y-4`}>
        {messages.map((msg, i) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}
            style={{ animationDelay: `${i * 0.05}s` }}>
            {msg.sender === 'bot' && (
              <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl flex items-center justify-center text-sm mr-2 mt-auto flex-shrink-0">🌿</div>
            )}
            <div className={msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}>
              {msg.text.split('\n').map((line, j) => (
                <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
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
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            rows={1} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
            style={{ maxHeight: '120px' }}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim()}
            className="w-10 h-10 rounded-2xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:-translate-y-0.5 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Not a substitute for professional help ·
          <button onClick={() => setShowCrisis(true)} className="text-sky-500 hover:underline ml-1">Crisis resources</button>
        </p>
      </div>
    </div>
  )
}
