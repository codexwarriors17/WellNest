// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getMoodLogs, analyzeMoodTrend } from '../firebase/firebaseFunctions'
import { prepareMoodChartData, getMoodEmoji, MOODS } from '../services/moodService'
import { formatDate, getGreeting } from '../utils/dateUtils'
import MoodTracker from '../components/MoodTracker'
import { BadgeCard, computeBadges } from '../components/badges/BadgeSystem'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import toast from 'react-hot-toast'

const ALERT_STYLES = {
  positive:         { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', icon: '🌟' },
  normal:           { bg: 'bg-sky-50',       border: 'border-sky-200',     text: 'text-sky-700',     icon: '💙' },
  concerning:       { bg: 'bg-amber-50',     border: 'border-amber-200',   text: 'text-amber-700',   icon: '⚠️' },
  critical:         { bg: 'bg-rose-50',      border: 'border-rose-200',    text: 'text-rose-700',    icon: '🆘' },
  insufficient_data:{ bg: 'bg-slate-50',     border: 'border-slate-200',   text: 'text-slate-600',   icon: '🌱' },
}

const QuickCard = ({ emoji, title, desc, to, gradient }) => (
  <Link to={to} className={`card-hover bg-gradient-to-br ${gradient} border-0 group`}>
    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{emoji}</div>
    <div className="font-semibold text-slate-800 text-sm">{title}</div>
    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
  </Link>
)

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xl text-center">
      <div className="text-2xl mb-1">{d.emoji}</div>
      <div className="text-xs font-semibold text-slate-700 capitalize">{d.mood}</div>
      <div className="text-xs text-slate-400">{d.date}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState(null)
  const [chartData, setChartData] = useState([])
  const [exportLoading, setExportLoading] = useState('')
  const [exportDays, setExportDays] = useState(30)

  const fetchLogs = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getMoodLogs(user.uid, 30)
      setLogs(data)
      setAnalysis(analyzeMoodTrend(data))
      setChartData(prepareMoodChartData(data))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [user])

  const handleExport = async (type) => {
    if (!user) return
    setExportLoading(type)
    try {
      const { exportMoodCSV, exportMoodPDF, sharePDFWithDoctor } = await import('../services/exportService')
      const name = profile?.displayName || 'User'
      if (type === 'csv') {
        const ok = await exportMoodCSV(user.uid, name)
        ok ? toast.success('CSV downloaded! 📊') : toast.error('No data to export.')
      } else if (type === 'pdf') {
        const ok = await exportMoodPDF(user.uid, name, profile?.streak || 0, profile?.totalLogs || 0, exportDays)
        ok ? toast.success('PDF report opened! 📄') : toast.error('No data to export.')
      } else if (type === 'doctor') {
        const ok = await sharePDFWithDoctor(user.uid, name, profile?.streak || 0, profile?.totalLogs || 0, exportDays)
        ok ? toast.success('Email drafted! 📧') : toast.error('No data to share.')
      }
    } catch { toast.error('Export failed. Try again.') }
    setExportLoading('')
  }

  const name = profile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Friend'
  const streak = profile?.streak || 0
  const totalLogs = profile?.totalLogs || logs.length

  // Compute badges
  const badgeStats = {
    totalLogs, streak,
    positiveDays: logs.filter(l => ['great','good'].includes(l.mood)).length,
    usedBreathing: !!localStorage.getItem('wellnest_used_breathing'),
    usedJournal: !!(JSON.parse(localStorage.getItem('wellnest_journal') || '[]').length),
    loggedAfterBadDay: logs.some((l, i) => i > 0 && logs[i-1]?.mood === 'terrible' && l.mood !== 'terrible'),
  }
  const earnedBadges = computeBadges(badgeStats).filter(b => b.earned).slice(0, 3)

  const alert = analysis ? ALERT_STYLES[analysis.status] || ALERT_STYLES.normal : null

  return (
    <div className="page-container">
      <div className="content-wrapper">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap animate-fade-up">
          <div>
            <p className="text-sm text-slate-400 font-medium">{getGreeting()},</p>
            <h1 className="font-display text-3xl text-slate-900">{name} 👋</h1>
            <p className="text-sm text-slate-500 mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-3">
            {[
              { value: streak, label: 'Day Streak', icon: streak >= 7 ? '🔥' : '✨', color: 'from-orange-50 to-amber-50 border-orange-100' },
              { value: totalLogs, label: 'Total Logs', icon: '📊', color: 'from-sky-50 to-cyan-50 border-sky-100' },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.color} border rounded-2xl px-4 py-3 text-center min-w-[80px]`}>
                <div className="text-lg">{s.icon}</div>
                <div className="stat-number text-xl">{s.value}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI ANALYSIS BANNER ── */}
        {analysis && alert && (
          <div className={`${alert.bg} border ${alert.border} rounded-2xl p-4 animate-fade-up delay-100`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{alert.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${alert.text}`}>AI Mood Analysis</p>
                <p className={`text-sm mt-0.5 ${alert.text} opacity-80`}>{analysis.message}</p>
                {analysis.avg && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500">7-day avg: {analysis.avg}/5</span>
                    </div>
                    <div className="progress-bar w-48">
                      <div className="progress-fill" style={{ width: `${(analysis.avg / 5) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
              {analysis.alert && (
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <a href="tel:9152987821" className="text-xs bg-white border border-rose-200 text-rose-600 rounded-xl px-3 py-1.5 font-semibold hover:bg-rose-50 transition-colors text-center">
                    📞 iCall
                  </a>
                  <a href="tel:18602662345" className="text-xs bg-white border border-rose-200 text-rose-600 rounded-xl px-3 py-1.5 font-semibold hover:bg-rose-50 transition-colors text-center">
                    📞 Vandrevala
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MOOD + CHART ── */}
        <div className="grid md:grid-cols-2 gap-5 animate-fade-up delay-200">
          {/* Log mood */}
          <div className="card">
            <MoodTracker onMoodSaved={fetchLogs} />
          </div>

          {/* Chart */}
          <div className="card">
            <div className="section-header">
              <h2 className="font-display text-lg text-slate-800">Mood Trend</h2>
              {logs.length > 0 && (
                <span className="badge bg-sky-50 text-sky-600">{logs.length} logs</span>
              )}
            </div>
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1,5]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={18} ticks={[1,2,3,4,5]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5}
                    fill="url(#moodGrad)" dot={{ fill: '#0ea5e9', strokeWidth: 0, r: 3.5 }}
                    activeDot={{ r: 6, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-3 opacity-40">📈</div>
                <p className="text-sm text-slate-400">Log 2+ moods to see your trend</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RECENT LOGS ── */}
        <div className="card animate-fade-up delay-300">
          <div className="section-header">
            <h2 className="font-display text-lg text-slate-800">Recent Logs</h2>
            <Link to="/mood" className="text-xs text-sky-600 font-semibold hover:underline">View all →</Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 shimmer rounded-xl" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-slate-400 text-sm">No logs yet. Log your first mood above!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {logs.slice(0, 8).map((log, i) => {
                const mood = MOODS.find(m => m.id === log.mood)
                return (
                  <div key={log.id} className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors animate-slide-in delay-${i * 50}`}
                    style={{ borderLeft: `3px solid ${mood?.color || '#0ea5e9'}` }}>
                    <span className="text-xl">{getMoodEmoji(log.mood)}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-700 capitalize">{log.mood}</span>
                      {log.note && <p className="text-xs text-slate-400 truncate">{log.note}</p>}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(log.timestamp)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="animate-fade-up delay-300">
          <h2 className="font-display text-lg text-slate-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickCard emoji="💬" title="Chat Support" desc="Talk to AI companion" to="/chat" gradient="from-sky-50 to-cyan-50" />
            <QuickCard emoji="🌬️" title="Breathe" desc="Quick anxiety relief" to="/selfhelp" gradient="from-teal-50 to-emerald-50" />
            <QuickCard emoji="📝" title="Journal" desc="Write your thoughts" to="/selfhelp?tab=journal" gradient="from-amber-50 to-yellow-50" />
            <QuickCard emoji="🤸" title="Yoga" desc="Stretch & relax" to="/selfhelp?tab=yoga" gradient="from-violet-50 to-purple-50" />
            <QuickCard emoji="💬" title="Affirmations" desc="Positive self-talk" to="/selfhelp?tab=affirmations" gradient="from-rose-50 to-pink-50" />
            <QuickCard emoji="👥" title="Community" desc="You're not alone" to="/community" gradient="from-indigo-50 to-blue-50" />
            <QuickCard emoji="🏆" title="My Badges" desc="View achievements" to="/profile" gradient="from-orange-50 to-amber-50" />
            <QuickCard emoji="🧘" title="Meditate" desc="Calm your mind" to="/selfhelp?tab=meditate" gradient="from-cyan-50 to-sky-50" />
          </div>
        </div>

        {/* ── BADGES PREVIEW ── */}
        {earnedBadges.length > 0 && (
          <div className="card animate-fade-up delay-400">
            <div className="section-header">
              <h2 className="font-display text-lg text-slate-800">Recent Badges</h2>
              <Link to="/profile?tab=badges" className="text-xs text-sky-600 font-semibold hover:underline">View all →</Link>
            </div>
            <div className="flex gap-3">
              {earnedBadges.map(badge => <BadgeCard key={badge.id} badge={badge} size="sm" />)}
              <div className="flex-1 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center p-3 text-center min-h-[80px]">
                <p className="text-xs text-slate-400">Keep going for more!</p>
                <p className="text-lg mt-1">🎯</p>
              </div>
            </div>
          </div>
        )}

        {/* ── EXPORT ── */}
        <div className="card animate-fade-up delay-400 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-lg text-slate-800">Export Your Data</h2>
              <p className="text-xs text-slate-500 mt-0.5">Download your mood history as CSV, PDF, or share with your doctor</p>
            </div>
            {/* Period toggle */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {[7, 30].map(d => (
                <button key={d} onClick={() => setExportDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    exportDays === d ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}>
                  {d}-day
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleExport('csv')} disabled={!!exportLoading}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-xs hover:bg-emerald-100 transition-colors disabled:opacity-50">
              {exportLoading === 'csv' ? '⏳' : '📊'} CSV Data
            </button>
            <button onClick={() => handleExport('pdf')} disabled={!!exportLoading}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-sky-50 border border-sky-100 text-sky-700 font-semibold text-xs hover:bg-sky-100 transition-colors disabled:opacity-50">
              {exportLoading === 'pdf' ? '⏳' : '📄'} PDF Report
            </button>
            <button onClick={() => handleExport('doctor')} disabled={!!exportLoading}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-violet-50 border border-violet-100 text-violet-700 font-semibold text-xs hover:bg-violet-100 transition-colors disabled:opacity-50">
              {exportLoading === 'doctor' ? '⏳' : '🩺'} Share with Doctor
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
