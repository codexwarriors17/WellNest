// src/pages/ProfilePage.jsx
import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile } from '../firebase/firebaseFunctions'
import { requestNotificationPermission } from '../firebase/firebaseMessaging'
import BadgeSystem from '../components/badges/BadgeSystem'
import Button from '../components/Button'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
]

const AVATAR_COLORS = [
  'from-sky-400 to-sky-600',
  'from-violet-400 to-violet-600',
  'from-emerald-400 to-emerald-600',
  'from-rose-400 to-rose-500',
  'from-amber-400 to-amber-500',
  'from-cyan-400 to-cyan-600',
]

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, profile, refreshProfile } = useAuth()
  const [tab, setTab] = useState('profile') // 'profile' | 'badges' | 'settings'
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    displayName: profile?.displayName || user?.displayName || '',
    bio: profile?.bio || '',
    avatarColor: profile?.avatarColor || AVATAR_COLORS[0],
    language: profile?.language || i18n.language || 'en',
  })

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.displayName.trim()) return toast.error('Name cannot be empty')
    setLoading(true)
    try {
      await updateUserProfile(user.uid, {
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        avatarColor: form.avatarColor,
        language: form.language,
      })
      i18n.changeLanguage(form.language)
      await refreshProfile()
      toast.success('Profile updated! ✨')
    } catch {
      toast.error(t('errorOccurred'))
    }
    setLoading(false)
  }

  const handleEnableNotifications = async () => {
    const token = await requestNotificationPermission(user?.uid)
    if (token) toast.success('Notifications enabled! 🔔')
    else toast.error('Could not enable notifications. Check browser settings.')
  }

  // Compute stats for badges
  const stats = {
    totalLogs: profile?.totalLogs || 0,
    streak: profile?.streak || 0,
    positiveDays: profile?.positiveDays || 0,
    loggedAfterBadDay: profile?.loggedAfterBadDay || false,
    usedBreathing: !!localStorage.getItem('wellnest_used_breathing'),
    usedJournal: !!(JSON.parse(localStorage.getItem('wellnest_journal') || '[]').length),
  }

  const initials = (form.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const TABS = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'badges', label: '🏆 Badges' },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 page-enter">
      <div className="max-w-2xl mx-auto px-4 space-y-6">

        {/* Profile header card */}
        <div className="card overflow-hidden p-0">
          {/* Banner */}
          <div className={`h-24 bg-gradient-to-br ${form.avatarColor}`} />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${form.avatarColor} flex items-center justify-center text-white font-display text-2xl border-4 border-white shadow-card`}>
                {initials}
              </div>
              <div className="pb-1">
                <h1 className="font-display text-xl text-slate-800">{profile?.displayName || 'Your Name'}</h1>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-sky-50 rounded-2xl p-3 text-center">
                <div className="font-display text-2xl text-sky-600">{profile?.streak || 0}</div>
                <div className="text-xs text-slate-500 mt-0.5">Day Streak 🔥</div>
              </div>
              <div className="bg-violet-50 rounded-2xl p-3 text-center">
                <div className="font-display text-2xl text-violet-600">{profile?.totalLogs || 0}</div>
                <div className="text-xs text-slate-500 mt-0.5">Total Logs 📊</div>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                <div className="font-display text-2xl text-emerald-600">
                  {Object.values(stats).filter(Boolean).length}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Badges 🏆</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card">
          {TABS.map(tb => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === tb.id ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="card space-y-5 animate-fade-in">
            <h2 className="font-display text-lg text-slate-800">Edit Profile</h2>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Display Name</label>
              <input type="text" value={form.displayName} onChange={update('displayName')} className="input" placeholder="Your name" />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Bio <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea value={form.bio} onChange={update('bio')} rows={2} maxLength={150} className="input resize-none" placeholder="A little about yourself..." />
              <div className="text-right text-xs text-slate-400 mt-1">{form.bio.length}/150</div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Avatar Color</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setForm(prev => ({ ...prev, avatarColor: color }))}
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} transition-all duration-200 ${
                      form.avatarColor === color ? 'ring-2 ring-sky-400 ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Language</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setForm(prev => ({ ...prev, language: lang.code }))}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-sm ${
                      form.language === lang.code
                        ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium'
                        : 'border-slate-100 hover:border-sky-200 text-slate-600'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.native}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} loading={loading} className="w-full">
              Save Changes
            </Button>
          </div>
        )}

        {/* Badges tab */}
        {tab === 'badges' && (
          <div className="card animate-fade-in">
            <BadgeSystem stats={stats} />
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="space-y-4 animate-fade-in">
            <div className="card space-y-4">
              <h2 className="font-display text-lg text-slate-800">Notifications</h2>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div>
                  <div className="font-medium text-slate-700 text-sm">Daily Mood Reminders</div>
                  <div className="text-xs text-slate-500">Get a gentle nudge every evening</div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleEnableNotifications}>Enable</Button>
              </div>
            </div>

            <div className="card space-y-4">
              <h2 className="font-display text-lg text-slate-800">Privacy & Data</h2>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Your mood data is private and only visible to you</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Chat conversations are stored securely in Firebase</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>We never sell your data to third parties</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="font-display text-lg text-slate-800 mb-3">Crisis Resources</h2>
              <div className="space-y-2">
                {[
                  { name: 'iCall', number: '9152987821' },
                  { name: 'Vandrevala Foundation', number: '1860-2662-345' },
                  { name: 'Aasra', number: '9820466627' },
                ].map(h => (
                  <a key={h.name} href={`tel:${h.number}`}
                    className="flex justify-between items-center p-3 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors">
                    <span className="font-medium text-rose-700 text-sm">{h.name}</span>
                    <span className="text-rose-600 text-sm font-mono">📞 {h.number}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
