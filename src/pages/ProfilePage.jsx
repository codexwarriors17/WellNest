// src/pages/ProfilePage.jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile } from '../firebase/firebaseFunctions'
import { useFCM } from '../hooks/useFCM'
import { setReminderEnabled } from '../firebase/firebaseMessaging'
import BadgeSystem from '../components/badges/BadgeSystem'
import Button from '../components/Button'
import toast from 'react-hot-toast'
import { linkAnonWithEmail, linkAnonWithGoogle } from '../firebase/firebaseFunctions'
import { exportMoodPDF, exportMoodCSV } from '../services/exportService'

const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi',    native: 'हिंदी',    flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi',  native: 'मराठी',    flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil',    native: 'தமிழ்',    flag: '🇮🇳' },
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
  const { user, profile, refreshProfile, isAnonymous } = useAuth()
  const [tab, setTab]     = useState('profile')
  const { permission: notifPermission, requestPermission } = useFCM(user?.uid || null)
  const [loading, setLoading]         = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState('')

  // Derive reminder state from Firestore profile
  const reminderOn = profile?.reminderEnabled === true && notifPermission === 'granted'

  const [form, setForm] = useState({
    displayName: profile?.displayName || user?.displayName || '',
    bio:         profile?.bio || '',
    avatarColor: profile?.avatarColor || AVATAR_COLORS[0],
    language:    profile?.language || i18n.language || 'en',
  })

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const [upgradeMode, setUpgradeMode]   = useState(false)
  const [upgradeForm, setUpgradeForm]   = useState({ email: '', password: '', name: '' })
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [googleUpgrading, setGoogleUpgrading] = useState(false)
  const updateUpgrade = (field) => (e) => setUpgradeForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleUpgradeEmail = async (e) => {
    e.preventDefault()
    if (!upgradeForm.name.trim()) return toast.error('Enter your name')
    if (upgradeForm.password.length < 6) return toast.error('Password needs 6+ characters')
    setUpgradeLoading(true)
    try {
      await linkAnonWithEmail(upgradeForm.email, upgradeForm.password, upgradeForm.name)
      await refreshProfile()
      toast.success('Account upgraded! Your data is saved permanently 🎉')
      setUpgradeMode(false)
    } catch (err) {
      toast.error(err.code === 'auth/email-already-in-use' ? 'That email is already in use.' : 'Upgrade failed. Try again.')
    }
    setUpgradeLoading(false)
  }

  const handleUpgradeGoogle = async () => {
    setGoogleUpgrading(true)
    try {
      await linkAnonWithGoogle()
      await refreshProfile()
      toast.success('Account linked to Google! 🎉')
    } catch (err) {
      toast.error(err.code === 'auth/credential-already-in-use' ? 'This Google account is already in use.' : 'Google link failed.')
    }
    setGoogleUpgrading(false)
  }

  const handleSave = async () => {
    if (!form.displayName.trim()) return toast.error('Name cannot be empty')
    setLoading(true)
    try {
      await updateUserProfile(user.uid, {
        displayName: form.displayName.trim(),
        bio:         form.bio.trim(),
        avatarColor: form.avatarColor,
        language:    form.language,
      })
      i18n.changeLanguage(form.language)
      await refreshProfile()
      toast.success('Profile updated! ✨')
    } catch {
      toast.error(t('errorOccurred'))
    }
    setLoading(false)
  }

  // ── Daily Reminder Toggle ─────────────────────────────────────────────
  const handleToggleReminder = async () => {
    if (!user?.uid) return

    // If notifications are blocked in browser, guide user
    if (notifPermission === 'denied') {
      toast.error('Notifications are blocked. Please allow them in your browser settings, then try again.')
      return
    }

    setReminderLoading(true)
    try {
      if (reminderOn) {
        // Turn OFF: delete token from Firestore
        const ok = await setReminderEnabled(user.uid, false)
        if (ok) {
          await refreshProfile()
          toast.success('Daily reminders turned off.')
        } else {
          toast.error('Could not update. Try again.')
        }
      } else {
        // Turn ON: request permission + get token
        const ok = await setReminderEnabled(user.uid, true)
        if (ok) {
          await refreshProfile()
          toast.success("Daily reminders enabled! 🔔 You'll get a nudge every evening.")
        } else {
          toast.error('Could not enable notifications. Check browser settings.')
        }
      }
    } catch {
      toast.error('Something went wrong. Try again.')
    }
    setReminderLoading(false)
  }

  // ── Export ────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    setExportLoading('pdf')
    try {
      const ok = await exportMoodPDF(user.uid, profile?.displayName || 'User', profile?.streak || 0, profile?.totalLogs || 0)
      if (!ok) toast.error('No mood data to export yet.')
    } catch { toast.error('Export failed.') }
    setExportLoading('')
  }

  const handleExportCSV = async () => {
    setExportLoading('csv')
    try {
      const ok = await exportMoodCSV(user.uid, profile?.displayName || 'User')
      if (!ok) toast.error('No mood data to export yet.')
    } catch { toast.error('Export failed.') }
    setExportLoading('')
  }

  // Badge stats
  const stats = {
    totalLogs:        profile?.totalLogs || 0,
    streak:           profile?.streak || 0,
    positiveDays:     profile?.positiveDays || 0,
    loggedAfterBadDay:profile?.loggedAfterBadDay || false,
    usedBreathing:    !!localStorage.getItem('wellnest_used_breathing'),
    usedJournal:      !!(JSON.parse(localStorage.getItem('wellnest_journal') || '[]').length),
  }

  const initials = (form.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const TABS = [
    { id: 'profile',  label: '👤 Profile'  },
    { id: 'badges',   label: '🏆 Badges'   },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 page-enter">
      <div className="max-w-2xl mx-auto px-4 space-y-6">

        {/* ── Upgrade Guest Banner ── */}
        {isAnonymous && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 animate-fade-up">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⭐</span>
              <div className="flex-1">
                <p className="font-semibold text-amber-800 text-sm">You're using a Guest account</p>
                <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                  Your mood logs and chat history are saved, but <strong>linked to this device only</strong>.
                  Create a free account to keep your data across devices forever.
                </p>
                <button onClick={() => setUpgradeMode(!upgradeMode)}
                  className="mt-3 btn-primary py-2 px-5 text-sm bg-amber-500 hover:bg-amber-600 shadow-[0_4px_14px_rgba(245,158,11,0.35)]">
                  {upgradeMode ? 'Cancel' : '🔓 Upgrade to Full Account — Free'}
                </button>
              </div>
            </div>

            {upgradeMode && (
              <div className="mt-5 pt-5 border-t border-amber-200 space-y-4 animate-fade-up">
                <button onClick={handleUpgradeGoogle} disabled={googleUpgrading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-2xl hover:-translate-y-0.5 hover:shadow-md transition-all text-sm disabled:opacity-50">
                  {googleUpgrading
                    ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  }
                  Link with Google
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-amber-200" />
                  <span className="text-xs text-amber-500 font-medium">or with email</span>
                  <div className="flex-1 h-px bg-amber-200" />
                </div>

                <form onSubmit={handleUpgradeEmail} className="space-y-3">
                  <input type="text" placeholder="Your name" required value={upgradeForm.name}
                    onChange={updateUpgrade('name')} className="input" />
                  <input type="email" placeholder="Email address" required value={upgradeForm.email}
                    onChange={updateUpgrade('email')} className="input" />
                  <input type="password" placeholder="Password (6+ characters)" required value={upgradeForm.password}
                    onChange={updateUpgrade('password')} className="input" />
                  <button type="submit" disabled={upgradeLoading}
                    className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
                    {upgradeLoading
                      ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Upgrading…</>
                      : 'Create Account & Keep My Data'
                    }
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Profile header card */}
        <div className="card overflow-hidden p-0">
          <div className={`h-24 bg-gradient-to-br ${form.avatarColor}`} />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${form.avatarColor} flex items-center justify-center text-white font-display text-2xl border-4 border-white shadow-card`}>
                {initials}
              </div>
              <div className="pb-1">
                <h1 className="font-display text-xl text-slate-800">{profile?.displayName || 'Your Name'}</h1>
                <p className="text-sm text-slate-500">{user?.email || (isAnonymous ? 'Guest Account' : '')}</p>
              </div>
            </div>

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
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === tb.id ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
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
                  <button key={color} onClick={() => setForm(prev => ({ ...prev, avatarColor: color }))}
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} transition-all duration-200 ${
                      form.avatarColor === color ? 'ring-2 ring-sky-400 ring-offset-2 scale-110' : 'hover:scale-105'
                    }`} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Language</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => setForm(prev => ({ ...prev, language: lang.code }))}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-sm ${
                      form.language === lang.code
                        ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium'
                        : 'border-slate-100 hover:border-sky-200 text-slate-600'
                    }`}>
                    <span>{lang.flag}</span>
                    <span>{lang.native}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} loading={loading} className="w-full">Save Changes</Button>
          </div>
        )}

        {/* ── Badges tab ── */}
        {tab === 'badges' && (
          <div className="card animate-fade-in">
            <BadgeSystem stats={stats} />
          </div>
        )}

        {/* ── Settings tab ── */}
        {tab === 'settings' && (
          <div className="space-y-4 animate-fade-in">

            {/* Notifications Card */}
            <div className="card space-y-4">
              <h2 className="font-display text-lg text-slate-800">Notifications</h2>

              {/* Daily Reminder Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <div className="font-medium text-slate-700 text-sm">Daily Mood Reminders</div>
                  <div className="text-xs text-slate-500 mt-0.5">Get a gentle nudge every evening at 8pm</div>
                  {notifPermission === 'denied' && (
                    <div className="text-xs text-rose-500 mt-1 font-medium">⚠️ Blocked in browser settings</div>
                  )}
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={handleToggleReminder}
                  disabled={reminderLoading || notifPermission === 'denied'}
                  className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    reminderOn ? 'bg-sky-500' : 'bg-slate-200'
                  }`}
                  style={{ width: '52px' }}
                  aria-label="Toggle daily reminders"
                >
                  {reminderLoading ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </span>
                  ) : (
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      reminderOn ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  )}
                </button>
              </div>

              {/* Status indicator */}
              <div className={`text-xs px-3 py-2 rounded-xl ${
                reminderOn ? 'bg-emerald-50 text-emerald-600' :
                notifPermission === 'denied' ? 'bg-rose-50 text-rose-600' :
                'bg-slate-50 text-slate-500'
              }`}>
                {reminderOn ? '✅ You\'ll receive daily mood reminders at ~8pm IST' :
                 notifPermission === 'denied' ? '🚫 Enable notifications in browser settings to use this feature' :
                 '🔕 Daily reminders are off — toggle above to enable'}
              </div>
            </div>

            {/* Data Export Card */}
            <div className="card space-y-4">
              <h2 className="font-display text-lg text-slate-800">Export Your Data</h2>
              <p className="text-xs text-slate-500">Download your mood history to share with your doctor or therapist.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleExportPDF} disabled={exportLoading === 'pdf'}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-sky-50 border border-sky-100 text-sky-700 font-semibold text-sm hover:bg-sky-100 transition-colors disabled:opacity-50">
                  {exportLoading === 'pdf'
                    ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : '📄'} PDF Report
                </button>
                <button onClick={handleExportCSV} disabled={exportLoading === 'csv'}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors disabled:opacity-50">
                  {exportLoading === 'csv'
                    ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : '📊'} CSV Data
                </button>
              </div>
            </div>

            {/* Privacy Card */}
            <div className="card space-y-4">
              <h2 className="font-display text-lg text-slate-800">Privacy & Data</h2>
              <div className="space-y-3 text-sm text-slate-600">
                {[
                  'Your mood data is private and only visible to you',
                  'Chat conversations are stored securely in Firebase',
                  'We never sell your data to third parties',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Crisis Resources */}
            <div className="card">
              <h2 className="font-display text-lg text-slate-800 mb-3">Crisis Resources</h2>
              <div className="space-y-2">
                {[
                  { name: 'iCall',                 number: '9152987821'    },
                  { name: 'Vandrevala Foundation', number: '1860-2662-345' },
                  { name: 'Aasra',                 number: '9820466627'    },
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
