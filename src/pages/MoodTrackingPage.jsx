// src/pages/MoodTrackingPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MoodTracker from '../components/MoodTracker'
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

export default function MoodTrackingPage() {
  const { t } = useTranslation()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'list' | 'stats'

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await getUserMoodLogs(30)
      setLogs(data || [])
    } catch (e) {
      console.error(e)
      setLogs([])
    }
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

  const mostCommon = useMemo(() => {
    if (!moodCounts.length) return null
    return moodCounts.reduce((a, b) => (a.count > b.count ? a : b), moodCounts[0])
  }, [moodCounts])

  const positivePercent = useMemo(() => {
    if (!logs?.length) return 0
    const positive = logs.filter((l) => ['great', 'good'].includes(l.mood)).length
    return Math.round((positive / logs.length) * 100)
  }, [logs])

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 page-enter">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="font-display text-3xl text-slate-800">{t('moodTracker')}</h1>
          <p className="text-slate-500 text-sm mt-1">Track and understand your emotional patterns</p>
        </div>

        {/* Log mood */}
        <div className="card">
          <MoodTracker onMoodSaved={fetchLogs} />
        </div>

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
                  </div>
                </div>
              </div>
            )}

            {/* Bar chart */}
            <div className="card">
              <h3 className="font-display text-lg text-slate-800 mb-4">Mood Distribution</h3>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={moodCounts} barSize={32}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: 12 }}
                    formatter={(val) => [val, 'times']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {moodCounts.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} opacity={entry.count > 0 ? 1 : 0.3} />
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