// src/pages/ChatPage.jsx
import Chatbot from '../components/Chatbot'

export default function ChatPage() {
  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto px-4 space-y-5">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 badge bg-emerald-100 text-emerald-700 mb-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Available 24/7
          </div>
          <h1 className="font-display text-3xl text-slate-900">Chat Support</h1>
          <p className="text-slate-500 text-sm mt-1">
            Talk to our AI companion — empathetic, non-judgmental, and always here.
          </p>
        </div>

        <div className="animate-fade-up delay-100">
          <Chatbot />
        </div>

        {/* Features row */}
        <div className="grid grid-cols-3 gap-3 animate-fade-up delay-200">
          {[
            { icon: '🔒', title: 'Private', desc: 'Conversations are secure' },
            { icon: '🌍', title: 'Multilingual', desc: 'Chat in your language' },
            { icon: '⚡', title: 'Instant', desc: 'No waiting, no queue' },
          ].map(f => (
            <div key={f.title} className="card text-center p-4">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-xs font-semibold text-slate-700">{f.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700 animate-fade-up delay-300">
          <p className="font-semibold mb-1">📋 Important Note</p>
          <p className="text-amber-600 text-xs leading-relaxed">
            This AI provides first-level emotional support and is not a replacement for professional mental health care.
            If you're in crisis, please call <a href="tel:9152987821" className="font-bold underline">iCall: 9152987821</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
