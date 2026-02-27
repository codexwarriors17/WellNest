// src/pages/MoodTrackingPage.jsx
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getMoodLogs } from '../firebase/firebaseFunctions'
import { MOODS, getMoodEmoji, getMoodColor } from '../services/moodService'
import { formatDate, formatTime } from '../utils/dateUtils'
import MoodTracker from '../components/MoodTracker'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function MoodTrackingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'list' | 'stats'

  const fetchLogs = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getMoodLogs(user.uid, 30)
      setLogs(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [user])

  // Stats
  const moodCounts = MOODS.map(mood => ({
    ...mood,
    count: logs.filter(l => l.mood === mood.id).length,
  }))

  const mostCommon = moodCounts.reduce((a, b) => a.count > b.count ? a : b, moodCounts[0])

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
          {['list', 'stats'].map(v => (
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
                {logs.map(log => {
                  const mood = MOODS.find(m => m.id === log.mood)
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      style={{ borderLeft: `3px solid ${mood?.color || '#0ea5e9'}` }}
                    >
                      <span className="text-2xl">{getMoodEmoji(log.mood)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 capitalize">{log.mood}</span>
                          <span className="text-xs text-slate-400">{formatDate(log.timestamp)} · {formatTime(log.timestamp)}</span>
                        </div>
                        {log.note && <p className="text-sm text-slate-500 mt-0.5">{log.note}</p>}
                      </div>
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
                    <div className="font-display text-2xl text-sky-600">
                      {Math.round(logs.filter(l => ['great', 'good'].includes(l.mood)).length / logs.length * 100)}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Positive days</div>
                  </div>
                </div>
              </div>
            )}

            {/* Bar chart */}
            <div className="card">
              <h3 className="font-display text-lg text-slate-800 mb-4">Mood Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={moodCounts} barSize={32}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: 12 }}
                    formatter={(val) => [val, 'times']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {moodCounts.map(entry => (
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
