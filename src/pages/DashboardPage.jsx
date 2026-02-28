// src/pages/DashboardPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

import { useAuth } from '../context/AuthContext'
import { getMoodLogs, analyzeMoodTrend } from '../firebase/firebaseFunctions'
import { prepareMoodChartData } from '../services/moodService'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [logs, setLogs] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardMood = async () => {
    if (!user?.uid) return
    setLoading(true)

    try {
      // ✅ fetch more logs for better analysis/history
      const data = await getMoodLogs(user.uid, 60)
      const safe = Array.isArray(data) ? data : []

      setLogs(safe)

      const a = analyzeMoodTrend(safe)
      setAnalysis(a)

      // ✅ last 14 points for chart
      setChartData(prepareMoodChartData(safe, 14))
    } catch (err) {
      console.error(err)
      setLogs([])
      setAnalysis(null)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardMood()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const avg7 = useMemo(() => analysis?.avg ?? null, [analysis])

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="font-display text-3xl text-slate-900">
            {t('dashboard') || 'Dashboard'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('dashboardSubtitle') || 'Your weekly mood overview'}
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-500">{t('totalLogs') || 'Total mood logs'}</div>
            <div className="font-display text-3xl text-slate-800 mt-1">{logs.length}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-500">{t('trend') || 'Trend'}</div>
            <div className="font-semibold text-slate-800 mt-2">
              {analysis?.status ? analysis.status.toUpperCase() : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-1">{analysis?.message || '—'}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-500">{t('avg7') || '7-day average'}</div>
            <div className="font-display text-3xl text-slate-800 mt-1">
              {avg7 !== null ? `${avg7}/5` : '—'}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-slate-800">
              {t('moodTrend') || 'Mood Trend (last 14)'}
            </h2>
            {loading && <span className="text-xs text-slate-400">Loading…</span>}
          </div>

          {!loading && chartData.length < 2 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-slate-500 text-sm">Log at least 2 moods to see a trend</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dashMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={18} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#dashMood)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}