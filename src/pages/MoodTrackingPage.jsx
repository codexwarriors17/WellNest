// src/pages/MoodTrackingPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMoodLogs } from '../firebase/firebaseFunctions'
import { MOODS, getMoodEmoji, getMoodColor } from '../services/moodService'
import { formatDate, formatTime } from '../utils/dateUtils'
import MoodTracker from '../components/MoodTracker'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts'

const MOOD_VALS = { great: 5, good: 4, neutral: 3, sad: 2, terrible: 1 }

export default function MoodTrackingPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('log')

  const fetchLogs = async () => {
    if (!user) return
    setLoading(true)
    try { const data = await getMoodLogs(user.uid, 30); setLogs(data) }
    catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchLogs() }, [user])

  const moodCounts = MOODS.map(mood => ({ ...mood, count: logs.filter(l => l.mood === mood.id).length }))
  const mostCommon = moodCounts.reduce((a, b) => a.count > b.count ? a : b, moodCounts[0])
  const avgScore = logs.length ? (logs.reduce((s, l) => s + (MOOD_VALS[l.mood] || 3), 0) / logs.length).toFixed(1) : '—'
  const positiveRate = logs.length ? Math.round(logs.filter(l => ['great','good'].includes(l.mood)).length / logs.length * 100) : 0

  const trendData = logs.slice(0, 14).reverse().map(log => ({
    date: log.timestamp?.toDate ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(log.timestamp.toDate()) : '',
    value: MOOD_VALS[log.mood] || 3,
    mood: log.mood,
    emoji: getMoodEmoji(log.mood),
  }))

  const TABS = [
    { id: 'log', label: '➕ Log Mood' },
    { id: 'history', label: `📋 History (${logs.length})` },
    { id: 'stats', label: '📊 Stats' },
  ]

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="animate-fade-up">
          <h1 className="font-display text-3xl text-slate-900">Mood Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">Track and understand your emotional patterns</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 w-fit shadow-sm border border-slate-100 animate-fade-up delay-100">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                view === tab.id ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}>{tab.label}
            </button>
          ))}
        </div>

        {/* Log tab */}
        {view === 'log' && (
          <div className="card animate-fade-up delay-100"><MoodTracker onMoodSaved={fetchLogs} /></div>
        )}

        {/* History tab */}
        {view === 'history' && (
          <div className="card animate-fade-up">
            <h2 className="font-display text-lg text-slate-800 mb-4">Mood History</h2>
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 shimmer rounded-2xl" />)}</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 opacity-40">🌱</div>
                <p className="text-slate-400 text-sm">No logs yet. Start tracking your mood!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {logs.map((log, i) => {
                  const mood = MOODS.find(m => m.id === log.mood)
                  return (
                    <div key={log.id} className={`flex items-start gap-3 p-3.5 rounded-2xl hover:bg-slate-50 transition-colors animate-slide-in delay-${Math.min(i * 50, 400)}`}
                      style={{ borderLeft: `3px solid ${mood?.color || '#0ea5e9'}` }}>
                      <span className="text-2xl leading-none mt-0.5">{getMoodEmoji(log.mood)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 text-sm capitalize">{log.mood}</span>
                          <span className="text-xs text-slate-400">{formatDate(log.timestamp)} · {formatTime(log.timestamp)}</span>
                        </div>
                        {log.note && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{log.note}</p>}
                      </div>
                      <div className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: `${mood?.color}20`, border: `1.5px solid ${mood?.color}40` }}>
                        <div className="w-full h-full rounded-full" style={{ background: mood?.color, opacity: 0.6, transform: `scale(${MOOD_VALS[log.mood] / 5})`, transformOrigin: 'center', transition: 'transform 0.3s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Stats tab */}
        {view === 'stats' && (
          <div className="space-y-5 animate-fade-up">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: getMoodEmoji(mostCommon?.id), label: 'Most Common', value: mostCommon?.label || '—', color: 'from-sky-50 to-cyan-50' },
                { icon: '📈', label: 'Avg Mood', value: `${avgScore}/5`, color: 'from-violet-50 to-purple-50' },
                { icon: '☀️', label: 'Positive Days', value: `${positiveRate}%`, color: 'from-amber-50 to-yellow-50' },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-center border border-white/80`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="stat-number text-xl">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            {trendData.length >= 2 && (
              <div className="card">
                <h3 className="font-display text-lg text-slate-800 mb-4">14-Day Mood Trend</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1,5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={18} />
                    <Tooltip contentStyle={{ borderRadius: '16px', fontSize: 12, border: '1px solid #f1f5f9' }}
                      formatter={(val, _, props) => [props.payload.emoji, props.payload.mood]} />
                    <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5}
                      fill="url(#g1)" dot={{ fill: '#0ea5e9', r: 3.5, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#0284c7', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Distribution chart */}
            <div className="card">
              <h3 className="font-display text-lg text-slate-800 mb-4">Mood Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={moodCounts} barSize={28}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ borderRadius: '16px', fontSize: 12, border: '1px solid #f1f5f9' }} formatter={v => [v, 'times']} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {moodCounts.map(entry => <Cell key={entry.id} fill={entry.color} opacity={entry.count > 0 ? 1 : 0.2} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
