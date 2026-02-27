// src/services/exportService.js
import { getMoodLogs } from '../firebase/firebaseFunctions'
import { getMoodEmoji } from './moodService'

// ── CSV Export ────────────────────────────────────────────────────
export const exportMoodCSV = async (uid, displayName = 'User') => {
  const logs = await getMoodLogs(uid, 365)
  if (!logs.length) return false

  const rows = [
    ['Date', 'Time', 'Mood', 'Score', 'Note'],
    ...logs.map(log => {
      const moodVals = { great: 5, good: 4, neutral: 3, sad: 2, terrible: 1 }
      const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date()
      return [
        new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date),
        new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(date),
        log.mood,
        moodVals[log.mood] || 3,
        `"${(log.note || '').replace(/"/g, '""')}"`,
      ]
    })
  ]

  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `WellNest_MoodData_${displayName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  return true
}

// ── PDF Export (using browser print) ─────────────────────────────
export const exportMoodPDF = async (uid, displayName = 'User', streak = 0, totalLogs = 0) => {
  const logs = await getMoodLogs(uid, 30)
  if (!logs.length) return false

  const moodVals = { great: 5, good: 4, neutral: 3, sad: 2, terrible: 1 }
  const avgMood = (logs.reduce((s, l) => s + (moodVals[l.mood] || 3), 0) / logs.length).toFixed(1)

  const moodBarColor = { great: '#22c55e', good: '#0ea5e9', neutral: '#f59e0b', sad: '#6366f1', terrible: '#f43f5e' }

  const rows = logs.slice(0, 30).map(log => {
    const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date()
    const color = moodBarColor[log.mood] || '#0ea5e9'
    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px;font-size:13px;color:#475569;">
          ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date)}
        </td>
        <td style="padding:10px 12px;font-size:18px;">${getMoodEmoji(log.mood)}</td>
        <td style="padding:10px 12px;">
          <span style="background:${color}20;color:${color};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;text-transform:capitalize;">${log.mood}</span>
        </td>
        <td style="padding:10px 12px;font-size:13px;color:#64748b;max-width:200px;">${log.note || '—'}</td>
      </tr>
    `
  }).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>WellNest Mood Report — ${displayName}</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #1e293b; padding: 40px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:white;padding:32px;border-radius:16px;margin-bottom:28px;">
        <div style="font-family:'DM Serif Display',serif;font-size:28px;margin-bottom:4px;">🌿 WellNest</div>
        <div style="font-size:18px;opacity:0.9;">Mood Report — ${displayName}</div>
        <div style="font-size:13px;opacity:0.7;margin-top:4px;">Generated on ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(new Date())}</div>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px;">
        ${[
          { label: 'Total Logs', value: totalLogs, icon: '📊', color: '#e0f2fe' },
          { label: 'Current Streak', value: `${streak} days 🔥`, icon: '⚡', color: '#fef9c3' },
          { label: 'Avg Mood (30d)', value: `${avgMood}/5`, icon: '😊', color: '#dcfce7' },
        ].map(s => `
          <div style="background:${s.color};border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:24px;margin-bottom:6px;">${s.icon}</div>
            <div style="font-family:'DM Serif Display',serif;font-size:20px;color:#0f172a;">${s.value}</div>
            <div style="font-size:12px;color:#64748b;margin-top:2px;">${s.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- Table -->
      <div style="font-family:'DM Serif Display',serif;font-size:20px;margin-bottom:16px;">Last 30 Mood Logs</div>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:12px;text-align:left;font-size:12px;color:#94a3b8;font-weight:600;">DATE</th>
            <th style="padding:12px;text-align:left;font-size:12px;color:#94a3b8;font-weight:600;">MOOD</th>
            <th style="padding:12px;text-align:left;font-size:12px;color:#94a3b8;font-weight:600;">STATUS</th>
            <th style="padding:12px;text-align:left;font-size:12px;color:#94a3b8;font-weight:600;">NOTE</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:28px;padding:16px;background:#f0f9ff;border-radius:12px;font-size:12px;color:#64748b;text-align:center;">
        WellNest — Your Mental Wellness Companion • Data is private and confidential<br>
        Crisis Support: iCall 9152987821 • Vandrevala Foundation 1860-2662-345
      </div>
    </body>
    </html>
  `

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 500)
  return true
}
