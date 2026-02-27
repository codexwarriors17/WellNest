// src/components/Chatbot.jsx
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { generateBotResponse, getInitialMessage } from '../services/chatService'
import { saveChatMessage, getChatHistory } from '../firebase/firebaseFunctions'

const EmergencyBanner = ({ onClose }) => (
  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mx-4 mb-2 animate-slide-up">
    <div className="flex justify-between items-start">
      <div>
        <p className="font-semibold text-rose-700 mb-1">🆘 Crisis Support Resources</p>
        <p className="text-sm text-rose-600">📞 iCall: 9152987821</p>
        <p className="text-sm text-rose-600">📞 Vandrevala: 1860-2662-345</p>
        <p className="text-xs text-rose-500 mt-1">Available 24/7 · Confidential</p>
      </div>
      <button onClick={onClose} className="text-rose-400 hover:text-rose-600 p-1">✕</button>
    </div>
  </div>
)

export default function Chatbot({ compact = false }) {
  const { t } = useTranslation()
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
          const formatted = history.map(m => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            timestamp: m.timestamp?.toDate?.() || new Date(),
          }))
          setMessages([getInitialMessage(), ...formatted])
        }
      }).catch(() => {})
    }
  }, [user])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    const userMsg = { id: Date.now(), sender: 'user', text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    if (user) {
      saveChatMessage(user.uid, { sender: 'user', text }).catch(() => {})
    }

    // Simulate typing delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 800))

    const { text: botText, isCrisis } = generateBotResponse(text)
    if (isCrisis) setShowCrisis(true)

    const botMsg = { id: Date.now() + 1, sender: 'bot', text: botText, timestamp: new Date() }
    setMessages(prev => [...prev, botMsg])
    setIsTyping(false)

    if (user) {
      saveChatMessage(user.uid, { sender: 'bot', text: botText }).catch(() => {})
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const height = compact ? 'h-80' : 'h-[500px]'

  return (
    <div className="flex flex-col bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white text-sm font-bold">W</div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">WellNest Companion</p>
          <p className="text-xs text-green-500">● Online · Here for you</p>
        </div>
        <div className="ml-auto">
          <span className="badge bg-sky-50 text-sky-600">AI Support</span>
        </div>
      </div>

      {/* Crisis banner */}
      {showCrisis && <EmergencyBanner onClose={() => setShowCrisis(false)} />}

      {/* Messages */}
      <div className={`${height} overflow-y-auto px-4 py-4 space-y-3`}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {msg.sender === 'bot' && (
              <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">🌿</div>
            )}
            <div className={msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-xs mr-2 mt-1">🌿</div>
            <div className="chat-bubble-bot">
              <div className="flex gap-1 py-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-100 px-4 py-3 flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('startChat')}
          rows={1}
          className="flex-1 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-xl bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed self-end"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-white px-4 pb-3">
        <p className="text-xs text-slate-400 text-center">
          Not a substitute for professional help · <button onClick={() => setShowCrisis(true)} className="text-sky-500 hover:underline">Crisis resources</button>
        </p>
      </div>
    </div>
  )
}
