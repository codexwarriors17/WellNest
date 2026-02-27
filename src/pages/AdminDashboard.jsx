// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  collection, getDocs, query, orderBy, limit, where
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { getMoodEmoji } from '../services/moodService'
import { formatDate } from '../utils/dateUtils'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'

// Add your Firebase UIDs here — or set role: 'admin' in Firestore users collection
const ADMIN_UIDS = [
  import.meta.env.VITE_ADMIN_UID || '',   // set VITE_ADMIN_UID in .env for quick setup
].filter(Boolean)

const StatCard = ({ icon, label, value, color }) => (
  <div className={`card border-l-4 ${color}`}>
    <div className="flex items-center gap-3">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="font-display text-2xl text-slate-800">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  </div>
)

const MOOD_COLORS = {
  great: '#22c55e', good: '#0ea5e9', neutral: '#f59e0b', sad: '#6366f1', terrible: '#f43f5e'
}

export default function AdminDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [moodLogs, setMoodLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  // Access control
  const isAdmin = ADMIN_UIDS.includes(user?.uid) || profile?.role === 'admin'

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!isAdmin) { navigate('/dashboard'); return }
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersSnap, logsSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(query(collection(db, 'moodLogs'), orderBy('timestamp', 'desc'), limit(500))),
      ])
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setMoodLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  // Stats
  const totalUsers = users.length
  const activeToday = users.filter(u => u.lastLogDate === new Date().toDateString()).length
  const totalLogs = moodLogs.length
  const avgMoodValue = (() => {
    const vals = { great: 5, good: 4, neutral: 3, sad: 2, terrible: 1 }
    if (!moodLogs.length) return 0
    return (moodLogs.reduce((s, l) => s + (vals[l.mood] || 3), 0) / moodLogs.length).toFixed(1)
  })()

  // Mood distribution for pie
  const moodDist = ['great', 'good', 'neutral', 'sad', 'terrible'].map(mood => ({
    name: mood,
    value: moodLogs.filter(l => l.mood === mood).length,
    color: MOOD_COLORS[mood],
  })).filter(m => m.value > 0)

  // Crisis count (sad + terrible)
  const crisisCount = moodLogs.filter(l => ['terrible', 'sad'].includes(l.mood)).length

  // Logs per day (last 14 days)
  const logsPerDay = (() => {
    const days = {}
    moodLogs.forEach(log => {
      const d = log.timestamp?.toDate ? log.timestamp.toDate() : new Date()
      const key = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(d)
      days[key] = (days[key] || 0) + 1
    })
    return Object.entries(days).slice(0, 14).reverse().map(([date, count]) => ({ date, count }))
  })()

  // Users with streak > 7
  const highStreakUsers = users.filter(u => (u.streak || 0) >= 7).length

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="font-display text-2xl text-slate-800">Access Denied</h2>
          <p className="text-slate-500 mt-1">Admin privileges required.</p>
          <p className="text-xs text-slate-400 mt-3">Add your UID to ADMIN_UIDS in AdminDashboard.jsx</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
      </div>
    )
  }

  const TABS = ['overview', 'users', 'moods']

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 page-enter">
      <div className="max-w-5xl mx-auto px-4 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 text-xs font-medium px-3 py-1 rounded-full mb-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> Admin Dashboard
            </div>
            <h1 className="font-display text-3xl text-slate-800">WellNest Analytics</h1>
          </div>
          <button onClick={fetchData} className="btn-secondary text-sm py-2 px-4">
            🔄 Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                tab === t ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >{t}</button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="👥" label="Total Users" value={totalUsers} color="border-sky-400" />
              <StatCard icon="📊" label="Total Logs" value={totalLogs} color="border-violet-400" />
              <StatCard icon="⚡" label="Active Today" value={activeToday} color="border-emerald-400" />
              <StatCard icon="😊" label="Avg Mood" value={`${avgMoodValue}/5`} color="border-amber-400" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="🔥" label="High Streaks (7+)" value={highStreakUsers} color="border-orange-400" />
              <StatCard icon="⚠️" label="Low Mood Logs" value={crisisCount} color="border-rose-400" />
              <StatCard icon="📅" label="Logs (Today)" value={moodLogs.filter(l => {
                const d = l.timestamp?.toDate?.() || new Date()
                return d.toDateString() === new Date().toDateString()
              }).length} color="border-cyan-400" />
              <StatCard icon="💬" label="Languages" value="4" color="border-indigo-400" />
            </div>

            {/* Charts row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Logs per day */}
              <div className="card">
                <h3 className="font-display text-lg text-slate-800 mb-4">Daily Mood Logs</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={logsPerDay} barSize={20}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={25} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: 12 }} />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mood distribution pie */}
              <div className="card">
                <h3 className="font-display text-lg text-slate-800 mb-4">Mood Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={moodDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {moodDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val, name) => [val, name]} contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
                    <Legend formatter={(val) => `${getMoodEmoji(val)} ${val}`} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="card animate-fade-in">
            <h2 className="font-display text-lg text-slate-800 mb-4">All Users ({totalUsers})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-3 text-slate-500 font-medium">User</th>
                    <th className="pb-3 text-slate-500 font-medium">Streak</th>
                    <th className="pb-3 text-slate-500 font-medium">Total Logs</th>
                    <th className="pb-3 text-slate-500 font-medium">Joined</th>
                    <th className="pb-3 text-slate-500 font-medium">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xs font-semibold">
                            {(u.displayName || u.email)?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-700">{u.displayName || 'Anonymous'}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${u.streak >= 7 ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                          🔥 {u.streak || 0}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{u.totalLogs || 0}</td>
                      <td className="py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="py-3 text-slate-400">{u.lastLogDate || 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Moods tab */}
        {tab === 'moods' && (
          <div className="card animate-fade-in">
            <h2 className="font-display text-lg text-slate-800 mb-4">Recent Mood Logs ({moodLogs.length})</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {moodLogs.slice(0, 100).map(log => (
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
          </div>
        )}
      </div>
    </div>
  )
}
