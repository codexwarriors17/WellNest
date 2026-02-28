// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { analyzeMoodTrend } from '../firebase/firebaseFunctions'
import { getUserMoodLogs, prepareMoodChartData, getMoodEmoji, getMoodColor } from '../services/moodService'
import { formatDate, getGreeting } from '../utils/dateUtils'
import MoodTracker from '../components/MoodTracker'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const QuickAction = ({ emoji, title, desc, to, color }) => (
  <Link to={to} className="card-hover flex items-start gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color} flex-shrink-0`}>
      {emoji}
    </div>
    <div>
      <div className="font-semibold text-slate-700 text-sm">{title}</div>
      <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
    </div>
  </Link>
)

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-2 shadow-card text-xs">
      <div className="text-2xl text-center">{d.emoji}</div>
      <div className="text-slate-600 capitalize font-medium">{d.mood}</div>
      <div className="text-slate-400">{d.date}</div>
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
  const [view, setView] = useState('recent') // recent | history | chart

  const fetchLogs = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getUserMoodLogs(60) // ✅ fetch more for history
      setLogs(data)
      setAnalysis(analyzeMoodTrend(data))
      setChartData(prepareMoodChartData(data, 14)) // ✅ last 14 points for chart
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [user])

  const name =
    profile?.displayName?.split(' ')[0] ||
    user?.displayName?.split(' ')[0] ||
    'Friend'

  const alertColors = {
    positive: 'bg-green-50 border-green-200 text-green-700',
    normal: 'bg-sky-50 border-sky-200 text-sky-700',
    concerning: 'bg-amber-50 border-amber-200 text-amber-700',
    critical: 'bg-rose-50 border-rose-200 text-rose-700',
    insufficient_data: 'bg-slate-50 border-slate-200 text-slate-600',
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 page-enter">
      <div className="max-w-4xl mx-auto px-4 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{getGreeting()},</p>
            <h1 className="font-display text-3xl text-slate-800">{name} 👋</h1>
          </div>
          <div className="flex gap-3">
            <div className="card text-center px-4 py-2 min-w-[70px]">
              <div className="font-display text-xl text-sky-600">{profile?.streak || 0}</div>
              <div className="text-xs text-slate-500">{t('streak')}</div>
            </div>
            <div className="card text-center px-4 py-2 min-w-[70px]">
              <div className="font-display text-xl text-sky-600">{profile?.totalLogs || logs.length}</div>
              <div className="text-xs text-slate-500">{t('totalLogs')}</div>
            </div>
          </div>
        </div>

        {/* AI Analysis Banner */}
        {analysis && analysis.status !== 'insufficient_data' && (
          <div className={`border rounded-2xl p-4 animate-fade-in ${alertColors[analysis.status] || alertColors.normal}`}>
            <div className="flex items-start gap-2">
              <span>
                {analysis.status === 'critical'
                  ? '🆘'
                  : analysis.status === 'concerning'
                    ? '⚠️'
                    : analysis.status === 'positive'
                      ? '🌟'
                      : '💙'}
              </span>
              <div>
                <p className="text-sm font-medium">{analysis.message}</p>
                {analysis.avg && <p className="text-xs mt-1 opacity-70">7-day average: {analysis.avg}/5</p>}
              </div>
            </div>

            {analysis.alert && (
              <div className="mt-3 flex gap-2 flex-wrap">
                <a href="tel:9152987821" className="text-xs bg-white border rounded-xl px-3 py-1.5 font-medium hover:shadow-sm transition-all">
                  📞 iCall: 9152987821
                </a>
                <a href="tel:18602662345" className="text-xs bg-white border rounded-xl px-3 py-1.5 font-medium hover:shadow-sm transition-all">
                  📞 Vandrevala: 1860-2662-345
                </a>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Log mood */}
          <div className="card">
            <MoodTracker onMoodSaved={fetchLogs} />
          </div>

          {/* Mood trend chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg text-slate-800">{t('yourMoodTrend')}</h2>
              <span className="text-xs text-slate-400">Last 14 logs</span>
            </div>

            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0ea5e9"
                    strokeWidth={2.5}
                    dot={{ fill: '#0ea5e9', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#0284c7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3">📈</div>
                <p className="text-slate-500 text-sm">Log at least 2 moods to see your trend</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card w-fit">
          {[
            { id: 'recent', label: '📌 Recent' },
            { id: 'history', label: '📋 History' },
            { id: 'chart', label: '📊 Chart' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                view === v.id ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Mood section */}
        <div className="card">
          <h2 className="font-display text-lg text-slate-800 mb-4">
            {view === 'recent' ? t('recentLogs') : view === 'history' ? 'Mood History' : 'Mood Chart (last 14)'}
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-slate-500 text-sm">{t('noLogsYet')}</p>
            </div>
          ) : view === 'chart' ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(view === 'recent' ? logs.slice(0, 10) : logs).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  style={{ borderLeft: `3px solid ${getMoodColor(log.mood)}` }}
                >
                  <span className="text-xl">{getMoodEmoji(log.mood)}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700 capitalize">{log.mood}</span>
                    {log.note && <p className="text-xs text-slate-400 truncate">{log.note}</p>}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="font-display text-lg text-slate-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction emoji="💬" title="Chat Support" desc="Talk to our AI companion" to="/chat" color="bg-sky-50" />
            <QuickAction emoji="🧘" title="Breathe" desc="Guided relaxation" to="/selfhelp" color="bg-sage-50" />
            <QuickAction emoji="📝" title="Journal" desc="Write your thoughts" to="/selfhelp?tab=journal" color="bg-amber-50" />
            <QuickAction emoji="🤸" title="Yoga" desc="Stretch & relax" to="/selfhelp?tab=yoga" color="bg-violet-50" />
            <QuickAction emoji="💬" title="Affirmations" desc="Positive self-talk" to="/selfhelp?tab=affirmations" color="bg-rose-50" />
            <QuickAction emoji="👥" title="Community" desc="Anonymous peer support" to="/community" color="bg-emerald-50" />
            <QuickAction emoji="👤" title="My Profile" desc="Badges & settings" to="/profile" color="bg-indigo-50" />
            <QuickAction emoji="🎵" title="Meditate" desc="Calm your mind" to="/selfhelp?tab=meditate" color="bg-cyan-50" />
          </div>
        </div>
      </div>
    </div>
  )
}