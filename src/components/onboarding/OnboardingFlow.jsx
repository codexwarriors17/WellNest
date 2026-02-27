// src/components/onboarding/OnboardingFlow.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { updateUserProfile } from '../../firebase/firebaseFunctions'
import { useAuth } from '../../context/AuthContext'
import { requestNotificationPermission } from '../../firebase/firebaseMessaging'

const STEPS = [
  {
    id: 'welcome',
    emoji: '🌿',
    title: 'Welcome to WellNest',
    subtitle: 'Your safe space to breathe, reflect, and heal.',
    bg: 'from-sky-400 to-sky-600',
  },
  {
    id: 'mission',
    emoji: '💙',
    title: 'You\'re not alone',
    subtitle: 'Millions struggle silently. WellNest breaks that silence with compassionate, judgement-free support in your language.',
    bg: 'from-violet-400 to-violet-600',
  },
  {
    id: 'features',
    emoji: '✨',
    title: 'What we offer',
    features: [
      { icon: '💬', text: 'AI chat support, anytime' },
      { icon: '📊', text: 'Daily mood tracking' },
      { icon: '🧘', text: 'Breathing & meditation' },
      { icon: '🏆', text: 'Streak rewards & badges' },
    ],
    bg: 'from-emerald-400 to-emerald-600',
  },
  {
    id: 'language',
    emoji: '🌍',
    title: 'Choose your language',
    subtitle: 'WellNest speaks your language',
    bg: 'from-amber-400 to-amber-600',
  },
  {
    id: 'notifications',
    emoji: '🔔',
    title: 'Stay on track',
    subtitle: 'Enable gentle reminders to log your mood every day. You can turn these off anytime.',
    bg: 'from-rose-400 to-rose-500',
  },
  {
    id: 'ready',
    emoji: '🚀',
    title: 'You\'re all set!',
    subtitle: 'Your wellness journey starts now. Remember — every small step counts.',
    bg: 'from-sky-500 to-emerald-500',
  },
]

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
]

export default function OnboardingFlow({ onComplete }) {
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedLang, setSelectedLang] = useState('en')
  const [notifGranted, setNotifGranted] = useState(false)
  const [loading, setLoading] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  const handleNext = async () => {
    if (current.id === 'language') {
      i18n.changeLanguage(selectedLang)
    }
    if (current.id === 'notifications' && !notifGranted) {
      const token = await requestNotificationPermission(user?.uid)
      setNotifGranted(!!token)
    }
    if (isLast) {
      setLoading(true)
      if (user) {
        await updateUserProfile(user.uid, {
          onboarded: true,
          language: selectedLang,
        })
      }
      localStorage.setItem('wellnest_onboarded', 'true')
      onComplete?.()
      navigate('/dashboard')
      return
    }
    setStep(s => s + 1)
  }

  const handleSkip = async () => {
    if (user) await updateUserProfile(user.uid, { onboarded: true })
    localStorage.setItem('wellnest_onboarded', 'true')
    onComplete?.()
    navigate('/dashboard')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-sky-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${current.bg} p-8 text-white text-center`}>
          <div className="text-6xl mb-4 animate-float inline-block">{current.emoji}</div>
          <h2 className="font-display text-2xl mb-2">{current.title}</h2>
          {current.subtitle && (
            <p className="text-white/80 text-sm leading-relaxed">{current.subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Features step */}
          {current.id === 'features' && (
            <div className="space-y-3">
              {current.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-slate-700 font-medium text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Language step */}
          {current.id === 'language' && (
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all duration-200 ${
                    selectedLang === lang.code
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-100 hover:border-sky-200 hover:bg-sky-50/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{lang.flag}</div>
                  <div className="font-semibold text-slate-800 text-sm">{lang.native}</div>
                  <div className="text-xs text-slate-400">{lang.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* Notifications step */}
          {current.id === 'notifications' && (
            <div className="text-center space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-sm text-amber-700">
                  📅 We'll send you a gentle reminder every evening to check in with yourself.
                </p>
              </div>
              {notifGranted && (
                <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium animate-slide-up">
                  <span>✅</span> Notifications enabled!
                </div>
              )}
            </div>
          )}

          {/* Ready step */}
          {current.id === 'ready' && (
            <div className="text-center space-y-3">
              {[
                '🌱 Be kind to yourself',
                '📆 Log your mood daily',
                '🆘 Help is always here',
              ].map((tip, i) => (
                <div key={i} className="text-sm text-slate-600 bg-sky-50 rounded-xl py-2 px-4 animate-fade-in"
                  style={{ animationDelay: `${i * 0.15}s` }}>
                  {tip}
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 space-y-2">
            <button
              onClick={handleNext}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Setting up...' : isLast ? 'Start My Journey 🚀' : current.id === 'notifications' && !notifGranted ? 'Enable Reminders' : 'Continue →'}
            </button>
            {!isLast && (
              <button onClick={handleSkip} className="w-full text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors">
                Skip for now
              </button>
            )}
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step ? 'w-5 h-1.5 bg-sky-500' : 'w-1.5 h-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
