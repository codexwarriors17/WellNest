// src/pages/HomePage.jsx
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

const Feature = ({ emoji, title, desc }) => (
  <div className="card-hover group">
    <div className="text-3xl mb-3">{emoji}</div>
    <h3 className="font-display text-lg text-slate-800 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
)

const StatBubble = ({ number, label, color }) => (
  <div className={`text-center p-4 rounded-2xl ${color}`}>
    <div className="font-display text-2xl font-bold text-slate-800">{number}</div>
    <div className="text-xs text-slate-500 mt-1">{label}</div>
  </div>
)

export default function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sage-50 page-enter">
      {/* Hero */}
      <section className="pt-28 pb-16 px-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-sage-100/40 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-sm font-medium px-4 py-2 rounded-full mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse-slow"></span>
            Mental Health Support for India
          </div>

          <h1 className="font-display text-5xl md:text-7xl text-slate-800 mb-6 animate-slide-up">
            Your space to
            <span className="block text-gradient italic"> breathe & heal.</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 animate-fade-in leading-relaxed">
            WellNest provides compassionate mental health support through AI-powered chat, mood tracking, and guided self-help tools — available in your language, whenever you need it.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-base px-8 py-4">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-primary text-base px-8 py-4">
                  Get Started Free
                </Link>
                <Link to="/chat" className="btn-secondary text-base px-8 py-4">
                  Try Chat Support
                </Link>
              </>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-4">Free to use · Available in Hindi, Marathi, Tamil & more</p>
        </div>

        {/* Floating illustration */}
        <div className="max-w-2xl mx-auto mt-16 relative">
          <div className="bg-white rounded-3xl shadow-card p-6 border border-slate-100 relative animate-float">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center text-white">🌿</div>
              <div>
                <div className="text-sm font-semibold text-slate-800">WellNest Companion</div>
                <div className="text-xs text-green-500">● Online</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="chat-bubble-bot w-fit">Hi! I'm here for you. How are you feeling today? 🌸</div>
              <div className="chat-bubble-user w-fit ml-auto">I've been feeling anxious lately...</div>
              <div className="chat-bubble-bot w-fit">I hear you. Let's take this one step at a time. <br/>Try breathing with me — in for 4, hold for 4, out for 4.</div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2 text-sm shadow-card rotate-3">
            🔥 7-day streak!
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBubble number="10K+" label="Users Supported" color="bg-sky-50" />
          <StatBubble number="4" label="Languages" color="bg-sage-50" />
          <StatBubble number="24/7" label="Always Available" color="bg-amber-50" />
          <StatBubble number="100%" label="Confidential" color="bg-violet-50" />
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-center mb-2">Everything you need</h2>
          <p className="text-slate-500 text-center mb-8 max-w-xl mx-auto">
            Comprehensive tools designed specifically for the mental health challenges faced by people in India.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Feature emoji="💬" title="AI Chat Support" desc="Empathetic first-level support available in multiple Indian languages, any time of day or night." />
            <Feature emoji="📊" title="Mood Tracking" desc="Log your daily emotions and discover patterns with beautiful visual insights over time." />
            <Feature emoji="🧘" title="Self-Help Tools" desc="Guided breathing, meditation, and journaling exercises for stress and anxiety relief." />
            <Feature emoji="🔔" title="Smart Reminders" desc="Gentle push notifications to keep your wellness journey on track." />
            <Feature emoji="⚡" title="Works Offline" desc="Progressive Web App that functions even without internet connection." />
            <Feature emoji="🚨" title="Crisis Support" desc="Immediate connection to verified mental health helplines when you need urgent help." />
          </div>
        </div>
      </section>

      {/* Language support */}
      <section className="py-12 px-4 bg-sky-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl text-white mb-3">Breaking language barriers</h2>
          <p className="text-sky-200 mb-6">Mental health support in the language you think in</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[['English', '🇬🇧'], ['हिंदी', '🇮🇳'], ['मराठी', '🇮🇳'], ['தமிழ்', '🇮🇳']].map(([lang, flag]) => (
              <div key={lang} className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm border border-white/20">
                {flag} {lang}
              </div>
            ))}
            <div className="bg-white/10 text-sky-200 px-4 py-2 rounded-xl text-sm border border-white/10">+ More coming soon</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl text-slate-800 mb-4">Your mental health matters.</h2>
          <p className="text-slate-500 mb-8">Take the first step today. It's free, confidential, and always here for you.</p>
          <Link to={user ? '/dashboard' : '/login'} className="btn-primary text-lg px-10 py-4">
            {user ? 'Open Dashboard' : 'Start Your Journey'} →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sky-500 rounded-lg flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="font-display text-slate-600">WellNest</span>
          </div>
          <p>Not a substitute for professional mental health care</p>
          <div className="flex gap-4">
            <span>Crisis: 9152987821</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
