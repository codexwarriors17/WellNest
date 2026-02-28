// src/services/exportService.js
import { getMoodLogs } from '../firebase/firebaseFunctions'
import { getMoodEmoji, getMoodValue } from './moodService'
import { analyzeMoodTrend } from '../firebase/firebaseFunctions'

const MOOD_VALS  = { great: 5, good: 4, neutral: 3, sad: 2, terrible: 1 }
const MOOD_COLOR = { great: '#22c55e', good: '#0ea5e9', neutral: '#f59e0b', sad: '#6366f1', terrible: '#f43f5e' }

// ── Helper: format date ───────────────────────────────────────────────
const fmtDate = (ts) => {
  const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date())
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(d)
}

// ── CSV Export ────────────────────────────────────────────────────────
export const exportMoodCSV = async (uid, displayName = 'User') => {
  const logs = await getMoodLogs(uid, 365)
  if (!logs.length) return false

  const rows = [
    ['Date', 'Time', 'Mood', 'Score', 'Note'],
    ...logs.map(log => {
      const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date()
      return [
        new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date),
        new Intl.DateTimeFormat('en-IN', { timeStyle: 'short'  }).format(date),
        log.mood,
        MOOD_VALS[log.mood] || 3,
        `"${(log.note || '').replace(/"/g, '""')}"`,
      ]
    }),
  ]

  const csv  = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `WellNest_MoodData_${displayName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  return true
}

// ── Build PDF HTML ────────────────────────────────────────────────────
const buildPDFHtml = (logs, displayName, streak, totalLogs, periodLabel) => {
  const analysis    = analyzeMoodTrend(logs)
  const scores      = logs.map(l => MOOD_VALS[l.mood] || 3)
  const avgMood     = logs.length
    ? (scores.reduce((a, b) => a + b, 0) / logs.length).toFixed(1)
    : '—'
  const lowestLog   = logs.reduce((a, b) =>
    (MOOD_VALS[a.mood] || 3) < (MOOD_VALS[b.mood] || 3) ? a : b, logs[0])
  const lowestDay   = lowestLog ? fmtDate(lowestLog.timestamp) : '—'

  const trendLabel = {
    positive:         '📈 Improving',
    normal:           '➡️ Stable',
    concerning:       '📉 Declining',
    critical:         '⚠️ Critical — needs attention',
    insufficient_data:'🌱 Not enough data yet',
  }[analysis?.status] || '➡️ Stable'

  // Mood distribution
  const dist = ['great', 'good', 'neutral', 'sad', 'terrible'].map(m => ({
    id:    m,
    count: logs.filter(l => l.mood === m).length,
    pct:   logs.length ? Math.round(logs.filter(l => l.mood === m).length / logs.length * 100) : 0,
    color: MOOD_COLOR[m],
    emoji: getMoodEmoji(m),
    label: m.charAt(0).toUpperCase() + m.slice(1),
  }))

  const distributionBars = dist.map(d => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <span style="width:24px;font-size:16px;">${d.emoji}</span>
      <span style="width:60px;font-size:12px;color:#64748b;">${d.label}</span>
      <div style="flex:1;background:#f1f5f9;border-radius:999px;height:10px;overflow:hidden;">
        <div style="width:${d.pct}%;height:100%;background:${d.color};border-radius:999px;transition:width 0.3s;"></div>
      </div>
      <span style="width:36px;text-align:right;font-size:12px;font-weight:600;color:${d.color};">${d.count}</span>
    </div>
  `).join('')

  const tableRows = logs.slice(0, 30).map(log => {
    const color = MOOD_COLOR[log.mood] || '#0ea5e9'
    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px;font-size:12px;color:#475569;">${fmtDate(log.timestamp)}</td>
        <td style="padding:10px 12px;font-size:16px;">${getMoodEmoji(log.mood)}</td>
        <td style="padding:10px 12px;">
          <span style="background:${color}20;color:${color};padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:capitalize;">${log.mood}</span>
        </td>
        <td style="padding:10px 12px;font-size:12px;color:#64748b;max-width:180px;">${log.note || '—'}</td>
      </tr>
    `
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WellNest Mood Report — ${displayName}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #1e293b; padding: 40px; max-width: 860px; margin: 0 auto; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      @page { margin: 15mm; }
    }
    h1, h2, h3, .serif { font-family: 'DM Serif Display', serif; }
  </style>
</head>
<body>

  <!-- Print / Download Button (hidden on print) -->
  <div class="no-print" style="margin-bottom:24px;display:flex;gap:12px;">
    <button onclick="window.print()" style="background:#0ea5e9;color:white;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">
      ⬇️ Download / Print PDF
    </button>
    <button onclick="window.close()" style="background:#f1f5f9;color:#64748b;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">
      ✕ Close
    </button>
  </div>

  <!-- Header banner -->
  <div style="background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:white;padding:32px;border-radius:16px;margin-bottom:28px;">
    <div style="font-family:'DM Serif Display',serif;font-size:28px;margin-bottom:4px;">🌿 WellNest</div>
    <div style="font-size:18px;opacity:0.9;">Mood Report — ${displayName}</div>
    <div style="font-size:12px;opacity:0.7;margin-top:6px;">
      ${periodLabel} · Generated on ${fmtDate({ toDate: () => new Date() })}
    </div>
  </div>

  <!-- Summary Stats (4-grid) -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;">
    ${[
      { label: 'Total Logs',       value: logs.length,         icon: '📊', color: '#e0f2fe', textColor: '#0284c7' },
      { label: 'Avg Mood Score',   value: `${avgMood} / 5`,    icon: '😊', color: '#dcfce7', textColor: '#16a34a' },
      { label: 'Current Streak',   value: `${streak} days 🔥`, icon: '⚡', color: '#fef9c3', textColor: '#d97706' },
      { label: 'Lowest Mood Day',  value: lowestDay,           icon: '📅', color: '#ffe4e6', textColor: '#e11d48' },
    ].map(s => `
      <div style="background:${s.color};border-radius:14px;padding:18px;text-align:center;">
        <div style="font-size:22px;margin-bottom:8px;">${s.icon}</div>
        <div style="font-family:'DM Serif Display',serif;font-size:17px;color:${s.textColor};">${s.value}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px;">${s.label}</div>
      </div>
    `).join('')}
  </div>

  <!-- Trend + Distribution (2-col) -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;">

    <!-- Trend Analysis -->
    <div style="background:#f8fafc;border-radius:14px;padding:20px;">
      <div style="font-family:'DM Serif Display',serif;font-size:16px;margin-bottom:16px;">Trend Analysis</div>
      <div style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:8px;">${trendLabel}</div>
      <div style="font-size:13px;color:#64748b;line-height:1.6;">${analysis?.message || '—'}</div>
      ${analysis?.avg ? `<div style="margin-top:12px;padding:10px;background:#e0f2fe;border-radius:10px;font-size:13px;color:#0284c7;font-weight:600;">7-day avg score: ${analysis.avg} / 5</div>` : ''}
    </div>

    <!-- Mood Distribution -->
    <div style="background:#f8fafc;border-radius:14px;padding:20px;">
      <div style="font-family:'DM Serif Display',serif;font-size:16px;margin-bottom:16px;">Mood Distribution</div>
      ${distributionBars}
    </div>
  </div>

  <!-- Log Table -->
  <div style="font-family:'DM Serif Display',serif;font-size:20px;margin-bottom:16px;">
    Mood Logs (last ${Math.min(logs.length, 30)} entries)
  </div>
  <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:28px;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="padding:12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.05em;">DATE</th>
        <th style="padding:12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.05em;">MOOD</th>
        <th style="padding:12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.05em;">STATUS</th>
        <th style="padding:12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.05em;">NOTE</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <!-- Footer -->
  <div style="padding:16px;background:#f0f9ff;border-radius:12px;font-size:11px;color:#64748b;text-align:center;line-height:1.8;">
    WellNest — Your Mental Wellness Companion · Data is private and confidential<br>
    <strong>Crisis Support:</strong> iCall 9152987821 · Vandrevala Foundation 1860-2662-345 · Aasra 9820466627<br>
    <em>This report is for personal use and sharing with your healthcare provider. It is not a medical diagnosis.</em>
  </div>

</body>
</html>`
}

// ── PDF Export (7-day or 30-day) ──────────────────────────────────────
export const exportMoodPDF = async (uid, displayName = 'User', streak = 0, totalLogs = 0, days = 30) => {
  const logs = await getMoodLogs(uid, days)
  if (!logs.length) return false

  const periodLabel = `${days}-Day Report`
  const html = buildPDFHtml(logs, displayName, streak, totalLogs, periodLabel)

  const win = window.open('', '_blank', 'width=900,height=800')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  return true
}

// ── Doctor Share via Email ────────────────────────────────────────────
export const sharePDFWithDoctor = async (uid, displayName = 'User', streak = 0, totalLogs = 0, days = 30) => {
  const logs = await getMoodLogs(uid, days)
  if (!logs.length) return false

  const analysis = analyzeMoodTrend(logs)
  const scores   = logs.map(l => MOOD_VALS[l.mood] || 3)
  const avg      = logs.length
    ? (scores.reduce((a, b) => a + b, 0) / logs.length).toFixed(1)
    : '—'

  const trendLabel = {
    positive:         'Improving',
    normal:           'Stable',
    concerning:       'Declining',
    critical:         'Critical — needs attention',
    insufficient_data:'Insufficient data',
  }[analysis?.status] || 'Stable'

  const subject = encodeURIComponent(`WellNest Mood Report — ${displayName}`)
  const body = encodeURIComponent(
    `Dear Doctor,\n\n` +
    `Please find below a summary of my recent mood data from WellNest.\n\n` +
    `─────────────────────────────\n` +
    `Patient: ${displayName}\n` +
    `Period: Last ${days} days\n` +
    `Total Entries: ${logs.length}\n` +
    `Average Mood Score: ${avg} / 5\n` +
    `Current Streak: ${streak} days\n` +
    `7-day Trend: ${trendLabel}\n` +
    (analysis?.message ? `Insight: ${analysis.message}\n` : '') +
    `─────────────────────────────\n\n` +
    `For a full detailed report with charts and day-by-day logs, I can share a PDF via WellNest.\n\n` +
    `Best regards,\n${displayName}`
  )

  window.open(`mailto:?subject=${subject}&body=${body}`, '_self')
  return true
}
