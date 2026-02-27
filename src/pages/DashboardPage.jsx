// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getMoodLogs, analyzeMoodTrend } from '../firebase/firebaseFunctions'
import { prepareMoodChartData, getMoodEmoji, getMoodColor } from '../services/moodService'
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

  const fetchLogs = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getMoodLogs(user.uid, 30)
      setLogs(data)
      setAnalysis(analyzeMoodTrend(data))
      setChartData(prepareMoodChartData(data))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [user])

  const name = profile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Friend'

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
              <span>{analysis.status === 'critical' ? '🆘' : analysis.status === 'concerning' ? '⚠️' : analysis.status === 'positive' ? '🌟' : '💙'}</span>
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

          {/* Mood chart */}
          <div className="card">
            <h2 className="font-display text-lg text-slate-800 mb-4">{t('yourMoodTrend')}</h2>
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={200}>
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

        {/* Recent logs */}
        <div className="card">
          <h2 className="font-display text-lg text-slate-800 mb-4">{t('recentLogs')}</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-slate-500 text-sm">{t('noLogsYet')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.slice(0, 10).map(log => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className="text-xl">{getMoodEmoji(log.mood)}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700 capitalize">{log.mood}</span>
                    {log.note && <p className="text-xs text-slate-400 truncate">{log.note}</p>}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(log.timestamp)}</span>
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

        {/* Export buttons */}
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-display text-lg text-slate-800">Export Your Data</h2>
              <p className="text-xs text-slate-500 mt-0.5">Download your mood history for personal records</p>
            </div>
            <div className="flex gap-2">
              <ExportButton uid={user?.uid} profile={profile} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export component
function ExportButton({ uid, profile }) {
  const [loading, setLoading] = useState(false)

  const handleExport = async (type) => {
    if (!uid) return
    setLoading(type)
    try {
      const { exportMoodCSV, exportMoodPDF } = await import('../services/exportService')
      const name = profile?.displayName || 'User'
      if (type === 'csv') await exportMoodCSV(uid, name)
      else await exportMoodPDF(uid, name, profile?.streak || 0, profile?.totalLogs || 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => handleExport('csv')} disabled={!!loading}
        className="btn-secondary text-sm py-2 px-4">
        {loading === 'csv' ? '...' : '📊 CSV'}
      </button>
      <button onClick={() => handleExport('pdf')} disabled={!!loading}
        className="btn-primary text-sm py-2 px-4">
        {loading === 'pdf' ? '...' : '📄 PDF Report'}
      </button>
    </>
  )
}
