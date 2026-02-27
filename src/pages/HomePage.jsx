// src/pages/HomePage.jsx
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'

const STATS = [
  { value: '1 in 5', label: 'Indians experience mental health issues' },
  { value: '83%', label: 'Never seek professional help' },
  { value: '₹0', label: 'Cost to use WellNest' },
  { value: '24/7', label: 'Always available for you' },
]

const FEATURES = [
  {
    icon: '💬', title: 'AI Companion Chat',
    desc: 'Empathetic first-level support in your language. Available any time — day or night.',
    color: 'from-sky-50 to-sky-100', accent: 'text-sky-600',
  },
  {
    icon: '📊', title: 'Mood Tracking',
    desc: 'Log daily emotions and discover patterns. Early AI alerts when things get tough.',
    color: 'from-violet-50 to-violet-100', accent: 'text-violet-600',
  },
  {
    icon: '🧘', title: 'Self-Help Tools',
    desc: 'Breathing, yoga, meditation, journaling, and affirmations — guided step by step.',
    color: 'from-emerald-50 to-emerald-100', accent: 'text-emerald-600',
  },
  {
    icon: '👥', title: 'Anonymous Community',
    desc: 'Share without fear. Connect with others who understand. You are not alone.',
    color: 'from-amber-50 to-amber-100', accent: 'text-amber-600',
  },
  {
    icon: '🏆', title: 'Streak & Badges',
    desc: 'Stay motivated with daily streaks and achievement badges for your progress.',
    color: 'from-rose-50 to-rose-100', accent: 'text-rose-600',
  },
  {
    icon: '⚡', title: 'Works Offline',
    desc: 'Progressive Web App. Access WellNest even without an internet connection.',
    color: 'from-cyan-50 to-cyan-100', accent: 'text-cyan-600',
  },
]

const TESTIMONIALS = [
  { text: "WellNest helped me understand my anxiety patterns. The breathing exercises genuinely helped during my panic attacks.", name: "Priya S.", city: "Mumbai", mood: "😊" },
  { text: "Being able to use it in Hindi made such a difference. I finally felt like someone understood me.", name: "Rahul K.", city: "Delhi", mood: "🌟" },
  { text: "The anonymous community feature is beautiful. Knowing others are going through similar things helped me feel less alone.", name: "Anjali M.", city: "Pune", mood: "💙" },
]

const LANGUAGES = ['English', 'हिंदी', 'मराठी', 'தமிழ்']

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev >= target) { clearInterval(timer); return target }
        return Math.min(prev + Math.ceil(target / 40), target)
      })
    }, 40)
    return () => clearInterval(timer)
  }, [target])
  return <span>{count}{suffix}</span>
}

export default function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center mesh-bg pt-24 pb-16 px-4 overflow-hidden">
        {/* Decorative orbs */}
        <div className="orb orb-sky w-96 h-96 top-10 -right-20" />
        <div className="orb orb-violet w-72 h-72 bottom-20 -left-16" />
        <div className="orb orb-mint w-64 h-64 top-1/2 left-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-sky-200 text-sky-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 animate-fade-up shadow-sm">
            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
            Built for India's Mental Health Crisis
            <span className="bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full text-[10px]">FREE</span>
          </div>

          {/* Headline */}
          <h1 className="heading-xl text-slate-900 mb-6 animate-fade-up delay-100">
            Your mind deserves
            <span className="block text-gradient-sky italic"> a safe haven.</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            WellNest provides compassionate mental health support through AI, mood tracking,
            and guided self-help — available in your language, whenever you need it.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
            {user ? (
              <Link to="/dashboard" className="btn-gradient text-base px-10 py-4 rounded-2xl">
                Open Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-gradient text-base px-10 py-4 rounded-2xl">
                  Start for Free — No signup needed
                </Link>
                <Link to="/chat" className="btn-secondary text-base px-8 py-4">
                  💬 Try Chat Support
                </Link>
              </>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-4 animate-fade-up delay-400">
            Free forever · Available in {LANGUAGES.join(', ')} · Works offline
          </p>

          {/* Floating app preview */}
          <div className="mt-16 relative max-w-lg mx-auto animate-fade-up delay-500">
            <div className="card-glass rounded-3xl p-5 shadow-2xl animate-float">
              {/* App header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm">W</div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-800">WellNest Companion</div>
                  <div className="text-xs text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online · Always here
                  </div>
                </div>
                <div className="ml-auto badge bg-sky-50 text-sky-600">AI Support</div>
              </div>

              {/* Chat preview */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-xs flex-shrink-0">🌿</div>
                  <div className="bubble-bot text-xs !rounded-bl-sm">
                    Hi! I'm here for you, no judgement. How are you feeling today? 🌸
                  </div>
                </div>
                <div className="bubble-user text-xs !rounded-br-sm">
                  I've been really anxious about my exams...
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-xs flex-shrink-0">🌿</div>
                  <div className="bubble-bot text-xs !rounded-bl-sm">
                    I hear you. Exam anxiety is so real and valid 💙<br/>
                    Let's try a quick breathing exercise together...
                  </div>
                </div>
              </div>

              {/* Mood row */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                <span className="text-xs text-slate-500 mr-1">Today:</span>
                {['😊','🙂','😐','😔','😢'].map((e, i) => (
                  <span key={i} className={`text-lg cursor-pointer transition-transform hover:scale-125 ${i === 1 ? 'scale-125' : 'opacity-60'}`}>{e}</span>
                ))}
                <span className="ml-auto text-xs text-sky-600 font-semibold">🔥 7 days</span>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-white border border-slate-100 rounded-2xl px-3 py-2 shadow-lg text-sm animate-float" style={{animationDelay:'1s'}}>
              🏆 Week Warrior badge earned!
            </div>
            <div className="absolute -bottom-3 -left-4 bg-white border border-slate-100 rounded-2xl px-3 py-2 shadow-lg text-xs animate-float" style={{animationDelay:'2s'}}>
              ✅ Mood logged · Streak: 7 days 🔥
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900 text-white relative overflow-hidden">
        <div className="orb orb-sky w-64 h-64 top-0 right-0 opacity-20" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <span className="badge bg-rose-500/20 text-rose-400 mb-4">The Reality</span>
            <h2 className="heading-lg text-white mb-4">India's silent mental health crisis</h2>
            <p className="text-slate-400 max-w-xl mx-auto">The numbers are alarming. Most people suffer in silence because support is inaccessible, expensive, or stigmatized.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <div key={i} className={`bg-white/5 border border-white/10 rounded-2xl p-5 text-center animate-fade-up delay-${i * 100}`}>
                <div className="font-display text-3xl text-sky-400 mb-2">{stat.value}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-slate-300 text-lg font-display italic">
              "WellNest bridges the gap — free, multilingual, always available mental health support for every Indian."
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge bg-sky-100 text-sky-600 mb-3">Everything you need</span>
            <h2 className="heading-lg text-slate-900 mb-3">One app. Complete care.</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Comprehensive tools designed specifically for the mental wellness challenges faced in India.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className={`p-6 rounded-3xl bg-gradient-to-br ${f.color} border border-white/80 hover:-translate-y-1 transition-all duration-300 cursor-default animate-fade-up delay-${i * 100}`}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className={`font-display text-lg mb-2 ${f.accent}`}>{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LANGUAGE SUPPORT ─────────────────────────── */}
      <section className="py-20 px-4 mesh-bg">
        <div className="max-w-3xl mx-auto text-center">
          <span className="badge bg-sky-100 text-sky-600 mb-4">Multilingual</span>
          <h2 className="heading-lg text-slate-900 mb-3">Support in your mother tongue</h2>
          <p className="text-slate-500 mb-8">Mental health support is most effective in the language you think and feel in.</p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              { lang: 'English', flag: '🇬🇧', color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { lang: 'हिंदी', flag: '🇮🇳', color: 'bg-orange-50 border-orange-200 text-orange-700' },
              { lang: 'मराठी', flag: '🇮🇳', color: 'bg-green-50 border-green-200 text-green-700' },
              { lang: 'தமிழ்', flag: '🇮🇳', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            ].map(({ lang, flag, color }) => (
              <div key={lang} className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold ${color}`}>
                <span className="text-lg">{flag}</span> {lang}
              </div>
            ))}
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400">
              + More coming soon
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <span className="badge bg-white/10 text-slate-300 mb-6">Stories</span>
          <h2 className="heading-lg text-white mb-10">Real people. Real impact.</h2>
          <div className="relative">
            {TESTIMONIALS.map((t, i) => (
              <div key={i}
                className={`transition-all duration-500 ${i === activeTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0'}`}>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <div className="text-4xl mb-4">{t.mood}</div>
                  <p className="text-slate-300 text-lg leading-relaxed mb-6 italic">"{t.text}"</p>
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                    <span className="font-semibold text-white">{t.name}</span>
                    <span>·</span>
                    <span>{t.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`rounded-full transition-all duration-300 ${i === activeTestimonial ? 'w-6 h-2 bg-sky-400' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden mesh-bg">
        <div className="orb orb-sky w-80 h-80 -top-20 left-1/2 -translate-x-1/2" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="text-6xl mb-6 animate-float">🌿</div>
          <h2 className="heading-lg text-slate-900 mb-4">Your mental health matters.</h2>
          <p className="text-slate-500 text-lg mb-8 leading-relaxed">
            Taking the first step is the hardest part.<br/>WellNest makes it as easy as opening an app.
          </p>
          <Link to={user ? '/dashboard' : '/login'} className="btn-gradient text-lg px-12 py-4 rounded-2xl inline-block">
            {user ? 'Go to Dashboard →' : 'Start Your Journey — Free'}
          </Link>
          <p className="mt-4 text-xs text-slate-400">No credit card · No stigma · Always confidential</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <span className="font-display text-white text-lg">WellNest</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/selfhelp" className="hover:text-white transition-colors">Self-Help</Link>
              <Link to="/chat" className="hover:text-white transition-colors">Chat</Link>
              <Link to="/community" className="hover:text-white transition-colors">Community</Link>
            </div>
            <div className="text-sm">
              <span className="text-rose-400 font-semibold">Crisis? </span>
              <a href="tel:9152987821" className="hover:text-white transition-colors">iCall: 9152987821</a>
            </div>
          </div>
          <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs">
            <span>© 2026 WellNest · Built with 💙 for India</span>
            <span className="text-slate-500">Not a substitute for professional mental health care</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
