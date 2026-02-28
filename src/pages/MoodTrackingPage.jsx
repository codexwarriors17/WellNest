// src/pages/MoodTrackingPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MoodTracker from '../components/MoodTracker'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMoodLogs, deleteMoodLog, analyzeMoodTrend } from '../firebase/firebaseFunctions'
import { MOODS, getMoodEmoji, getMoodColor } from '../services/moodService'
import { formatDate, formatTime } from '../utils/dateUtils'

import {
  MOODS,
  getMoodEmoji,
  getMoodColor,
  getUserMoodLogs,
  prepareMoodChartData,
} from '../services/moodService'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

const TrendTooltip = ({ active, payload }) => {
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
import MoodTracker from '../components/MoodTracker'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area,
} from 'recharts'
import toast from 'react-hot-toast'

const MOOD_VALS = { great: 5, good: 4, neutral: 3, sad: 2, terrible: 1 }

// ── Emergency Banner ────────────────────────────────────────────────────
const CriticalMoodBanner = ({ onDismiss }) => (
  <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 animate-fade-up">
    <div className="flex items-start gap-3">
      <div className="text-2xl flex-shrink-0">🆘</div>
      <div className="flex-1">
        <p className="font-bold text-rose-700 text-sm mb-1">You've been struggling recently</p>
        <p className="text-xs text-rose-600 leading-relaxed mb-3">
          Your mood trend looks concerning over the past week. Please know that you're not alone —
          trained counsellors are available right now.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="tel:9152987821"
            className="flex items-center gap-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold text-xs px-3 py-2 rounded-xl transition-colors">
            📞 iCall: 9152987821
            <span className="text-rose-400 font-normal">Mon-Sat</span>
          </a>
          <a href="tel:18602662345"
            className="flex items-center gap-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold text-xs px-3 py-2 rounded-xl transition-colors">
            📞 Vandrevala: 1860-2662-345
            <span className="text-rose-400 font-normal">24/7</span>
          </a>
        </div>
      </div>
      <button onClick={onDismiss} className="text-rose-300 hover:text-rose-500 text-lg leading-none flex-shrink-0">✕</button>
    </div>
  </div>
)

// ── Trend Insight Badge ──────────────────────────────────────────────────
const TrendBadge = ({ analysis }) => {
  if (!analysis || analysis.status === 'insufficient_data') return null

  const configs = {
    positive:   { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', icon: '📈', label: 'Improving'  },
    normal:     { bg: 'bg-sky-50',       text: 'text-sky-700',     border: 'border-sky-200',     icon: '➡️', label: 'Stable'     },
    concerning: { bg: 'bg-amber-50',     text: 'text-amber-700',   border: 'border-amber-200',   icon: '📉', label: 'Declining'  },
    critical:   { bg: 'bg-rose-50',      text: 'text-rose-700',    border: 'border-rose-200',    icon: '⚠️', label: 'Critical'   },
  }

  const c = configs[analysis.status] || configs.normal

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${c.bg} ${c.border}`}>
      <span className="text-xl flex-shrink-0">{c.icon}</span>
      <div>
        <p className={`font-semibold text-sm ${c.text}`}>Trend: {c.label}</p>
        <p className={`text-xs mt-0.5 leading-relaxed opacity-80 ${c.text}`}>{analysis.message}</p>
        {analysis.avg !== null && (
          <p className={`text-xs mt-1 font-medium ${c.text}`}>7-day avg: {analysis.avg}/5</p>
        )}
      </div>
    </div>
  )
}

export default function MoodTrackingPage() {
  const { t } = useTranslation()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'list' | 'stats'
  const { user, profile } = useAuth()
  const [logs,       setLogs]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState('log')
  const [chartRange, setChartRange] = useState(7)   // 7 or 30
  const [deletingId, setDeletingId] = useState(null)
  const [showCritical, setShowCritical] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await getUserMoodLogs(30)
      setLogs(data || [])
    } catch (e) {
      console.error(e)
      setLogs([])
    }
      const data = await getMoodLogs(user.uid, 30)
      setLogs(data)
      // Auto-show critical banner if trend is critical
      const analysis = analyzeMoodTrend(data)
      if (analysis?.alert) setShowCritical(true)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ✅ Trend line chart data (last 14)
  const trendData = useMemo(() => prepareMoodChartData(logs, 14), [logs])

  // ✅ Mood distribution (bar chart)
  const moodCounts = useMemo(() => {
    return MOODS.map((m) => ({
      ...m,
      count: (logs || []).filter((l) => l.mood === m.id).length,
    }))
  }, [logs])
  const handleDelete = async (logId) => {
    if (!window.confirm('Delete this mood log?')) return
    setDeletingId(logId)
    try {
      await deleteMoodLog(logId)
      setLogs(prev => prev.filter(l => l.id !== logId))
      toast.success('Log deleted')
    } catch {
      toast.error('Could not delete. Try again.')
    }
    setDeletingId(null)
  }

  // ── Derived stats ────────────────────────────────────────────────────
  const analysis = useMemo(() => analyzeMoodTrend(logs), [logs])
  const streak   = profile?.streak || 0

  const moodCounts = MOODS.map(mood => ({
    ...mood,
    count: logs.filter(l => l.mood === mood.id).length,
  }))

  const mostCommon = useMemo(() => {
    if (!moodCounts.length) return null
    return moodCounts.reduce((a, b) => (a.count > b.count ? a : b), moodCounts[0])
  }, [moodCounts])

  const positivePercent = useMemo(() => {
    if (!logs?.length) return 0
    const positive = logs.filter((l) => ['great', 'good'].includes(l.mood)).length
    return Math.round((positive / logs.length) * 100)
  }, [logs])
  const mostCommon = moodCounts.reduce(
    (a, b) => a.count > b.count ? a : b,
    moodCounts[0]
  )

  const avgScore = logs.length
    ? (logs.reduce((s, l) => s + (MOOD_VALS[l.mood] || 3), 0) / logs.length).toFixed(1)
    : '—'

  const positiveRate = logs.length
    ? Math.round(logs.filter(l => ['great', 'good'].includes(l.mood)).length / logs.length * 100)
    : 0

  // ── Chart data by range ──────────────────────────────────────────────
  const trendData = useMemo(() => {
    return logs
      .slice(0, chartRange)
      .reverse()
      .map(log => ({
        date: log.timestamp?.toDate
          ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(log.timestamp.toDate())
          : '',
        value: MOOD_VALS[log.mood] || 3,
        mood:  log.mood,
        emoji: getMoodEmoji(log.mood),
      }))
  }, [logs, chartRange])

  const TABS = [
    { id: 'log',     label: '➕ Log Mood'           },
    { id: 'history', label: `📋 History (${logs.length})` },
    { id: 'stats',   label: '📊 Stats'               },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 page-enter">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="font-display text-3xl text-slate-800">{t('moodTracker')}</h1>
    <div className="page-container">
      <div className="content-wrapper">

        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="font-display text-3xl text-slate-900">Mood Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">Track and understand your emotional patterns</p>
        </div>

        {/* Critical mood banner */}
        {showCritical && <CriticalMoodBanner onDismiss={() => setShowCritical(false)} />}

        {/* Streak pill */}
        {streak > 0 && (
          <div className="flex items-center gap-2 animate-fade-up delay-50">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
              <span className="text-base">🔥</span>
              <span className="font-semibold text-amber-700 text-sm">{streak}-day streak</span>
              <span className="text-amber-500 text-xs">— keep it up!</span>
            </div>
          </div>
        )}

        {/* Toggle */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card w-fit">
          {['list', 'stats'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                view === v ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v === 'list' ? '📋 History' : '📊 Stats'}
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 w-fit shadow-sm border border-slate-100 animate-fade-up delay-100">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                view === tab.id ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {view === 'list' ? (
          <div className="space-y-4">
            {/* Trend chart (in History view) */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-slate-800">Mood Trend (14 days)</h2>
                <span className="text-xs text-slate-400">{trendData.length} points</span>
              </div>

              {trendData.length >= 2 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[1, 5]}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={20}
                    />
                    <Tooltip content={<TrendTooltip />} />
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
                <div className="h-44 flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-slate-500 text-sm">Log at least 2 moods to see your trend</p>
                </div>
              )}
            </div>

            {/* History list */}
            <div className="card">
              <h2 className="font-display text-lg text-slate-800 mb-4">{t('moodHistory')}</h2>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">🌱</div>
                  <p className="text-slate-500">{t('noLogsYet')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => {
                    const dt = log.createdAt?.toDate?.() ? log.createdAt.toDate() : null
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                        style={{ borderLeft: `3px solid ${getMoodColor(log.mood)}` }}
                      >
                        <span className="text-2xl">{getMoodEmoji(log.mood)}</span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700 capitalize">{log.mood}</span>
                            <span className="text-xs text-slate-400">
                              {dt ? `${formatDate(log.createdAt)} · ${formatTime(log.createdAt)}` : 'N/A'}
                            </span>
                          </div>

                          {log.note && <p className="text-sm text-slate-500 mt-0.5">{log.note}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
        {/* ── Log tab ── */}
        {view === 'log' && (
          <div className="card animate-fade-up delay-100">
            <MoodTracker onMoodSaved={fetchLogs} />
          </div>
        )}

        {/* ── History tab ── */}
        {view === 'history' && (
          <div className="card animate-fade-up">
            <h2 className="font-display text-lg text-slate-800 mb-4">Mood History</h2>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 shimmer rounded-2xl" />)}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 opacity-40">🌱</div>
                <p className="text-slate-400 text-sm">No logs yet. Start tracking your mood!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {logs.map(log => {
                  const mood = MOODS.find(m => m.id === log.mood)
                  return (
                    <div key={log.id}
                      className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-slate-50 transition-colors group"
                      style={{ borderLeft: `3px solid ${mood?.color || '#0ea5e9'}` }}>

                      <span className="text-2xl leading-none mt-0.5">{getMoodEmoji(log.mood)}</span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 text-sm capitalize">{log.mood}</span>
                          <span className="text-xs text-slate-400">
                            {formatDate(log.timestamp)} · {formatTime(log.timestamp)}
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{log.note}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(log.id)}
                        disabled={deletingId === log.id}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-600 flex items-center justify-center transition-all flex-shrink-0 text-xs"
                        title="Delete log">
                        {deletingId === log.id ? '⏳' : '🗑'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary card */}
            {logs.length > 0 && (
              <div className="card bg-gradient-to-br from-sky-50 to-white">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl">{getMoodEmoji(mostCommon?.id)}</div>
                    <div className="text-xs text-slate-500 mt-1">Most common</div>
                    <div className="text-sm font-semibold text-slate-700 capitalize">{mostCommon?.id}</div>
                  </div>
                  <div>
                    <div className="font-display text-2xl text-sky-600">{logs.length}</div>
                    <div className="text-xs text-slate-500 mt-1">Total logs</div>
                  </div>
                  <div>
                    <div className="font-display text-2xl text-sky-600">{positivePercent}%</div>
                    <div className="text-xs text-slate-500 mt-1">Positive days</div>
        )}

        {/* ── Stats tab ── */}
        {view === 'stats' && (
          <div className="space-y-5 animate-fade-up">

            {/* Trend Insight */}
            <TrendBadge analysis={analysis} />

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: getMoodEmoji(mostCommon?.id), label: 'Most Common', value: mostCommon?.label || '—',    color: 'from-sky-50 to-cyan-50'     },
                { icon: '📈',                          label: 'Avg Mood',    value: `${avgScore}/5`,             color: 'from-violet-50 to-purple-50' },
                { icon: '☀️',                          label: 'Positive',    value: `${positiveRate}%`,          color: 'from-amber-50 to-yellow-50'  },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-center border border-white/80`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="stat-number text-xl">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Streak card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 flex items-center gap-4">
              <div className="text-4xl">🔥</div>
              <div>
                <div className="font-display text-2xl text-amber-700">{streak} day{streak !== 1 ? 's' : ''}</div>
                <div className="text-xs text-amber-600 mt-0.5">Current logging streak</div>
                {streak >= 7 && <div className="text-xs text-amber-500 mt-1 font-medium">🏆 Amazing consistency!</div>}
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-slate-500">Total logs</div>
                <div className="font-display text-xl text-slate-700">{logs.length}</div>
              </div>
            </div>

            {/* Trend chart with 7/30-day toggle */}
            {trendData.length >= 2 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-slate-800">Mood Trend</h3>
                  {/* Range toggle */}
                  <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                    {[7, 30].map(r => (
                      <button key={r} onClick={() => setChartRange(r)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          chartRange === r
                            ? 'bg-white text-sky-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}>
                        {r}d
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1,5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={18} />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', fontSize: 12, border: '1px solid #f1f5f9' }}
                      formatter={(val, _, props) => [props.payload.emoji, props.payload.mood]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5}
                      fill="url(#g1)" dot={{ fill: '#0ea5e9', r: 3.5, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#0284c7', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-400 text-center mt-1">Last {chartRange} entries</p>
              </div>
            )}

            {/* Distribution chart */}
            <div className="card">
              <h3 className="font-display text-lg text-slate-800 mb-4">Mood Distribution</h3>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={moodCounts} barSize={32}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={moodCounts} barSize={28}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', fontSize: 12, border: '1px solid #f1f5f9' }}
                    formatter={v => [v, 'times']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {moodCounts.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} opacity={entry.count > 0 ? 1 : 0.3} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {moodCounts.map(entry => (
                      <Cell key={entry.id} fill={entry.color} opacity={entry.count > 0 ? 1 : 0.2} />
                    ))}
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