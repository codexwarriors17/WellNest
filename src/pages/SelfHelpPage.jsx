// src/pages/SelfHelpPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

// ── Breathing Exercise ──────────────────────────────────────────
const BreathingExercise = () => {
  const [phase, setPhase] = useState('idle') // idle, inhale, hold, exhale
  const [count, setCount] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [running, setRunning] = useState(false)
  const timerRef = useRef(null)

  const PHASES = [
    { name: 'inhale', label: 'Breathe In', duration: 4, color: '#0ea5e9' },
    { name: 'hold', label: 'Hold', duration: 4, color: '#7dd3fc' },
    { name: 'exhale', label: 'Breathe Out', duration: 6, color: '#bae6fd' },
  ]

  const [phaseIndex, setPhaseIndex] = useState(0)

  const start = () => {
    setRunning(true)
    setPhase('inhale')
    setPhaseIndex(0)
    setCount(4)
    setCycles(0)
  }

  const stop = () => {
    setRunning(false)
    setPhase('idle')
    clearInterval(timerRef.current)
    setCount(0)
    setPhaseIndex(0)
  }

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          setPhaseIndex(pi => {
            const next = (pi + 1) % PHASES.length
            setPhase(PHASES[next].name)
            if (next === 0) setCycles(c => c + 1)
            const newCount = PHASES[next].duration
            return next
          })
          return PHASES[(phaseIndex + 1) % PHASES.length].duration
        }
        return prev - 1
      })
    }, 1000)
    timerRef.current = interval
    return () => clearInterval(interval)
  }, [running, phaseIndex])

  const currentPhase = PHASES[phaseIndex]
  const progress = running ? ((currentPhase.duration - count) / currentPhase.duration) * 100 : 0
  const circleSize = phase === 'inhale' ? 'scale-110' : phase === 'exhale' ? 'scale-75' : 'scale-100'

  return (
    <div className="card flex flex-col items-center py-8 space-y-6">
      <div>
        <h2 className="font-display text-xl text-slate-800 text-center">4-4-6 Breathing</h2>
        <p className="text-sm text-slate-500 text-center mt-1">A calming technique to reduce stress and anxiety</p>
      </div>

      {/* Circle */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-sky-100" />
        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="96" cy="96" r="88" fill="none" stroke={currentPhase?.color || '#0ea5e9'} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        {/* Inner circle */}
        <div
          className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-transform duration-1000 ${running ? circleSize : ''}`}
          style={{ background: `radial-gradient(circle, ${currentPhase?.color || '#e0f2fe'}40, ${currentPhase?.color || '#0ea5e9'}20)` }}
        >
          <div className="text-3xl mb-1">{phase === 'inhale' ? '🌬️' : phase === 'hold' ? '✋' : phase === 'exhale' ? '💨' : '🌿'}</div>
          {running && (
            <>
              <div className="text-2xl font-bold text-sky-700">{count}</div>
              <div className="text-xs text-sky-600 font-medium">{currentPhase?.label}</div>
            </>
          )}
        </div>
      </div>

      {cycles > 0 && <p className="text-sm text-slate-500">Completed cycles: <span className="font-semibold text-sky-600">{cycles}</span></p>}

      <button
        onClick={running ? stop : start}
        className={running ? 'btn-secondary' : 'btn-primary'}
      >
        {running ? 'Stop' : 'Start Breathing'}
      </button>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs text-center text-xs text-slate-500">
        {PHASES.map(p => (
          <div key={p.name} className={`p-2 rounded-xl transition-all ${phase === p.name ? 'bg-sky-50 text-sky-700 font-medium' : 'bg-slate-50'}`}>
            <div className="font-semibold capitalize">{p.name}</div>
            <div>{p.duration}s</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Journal ──────────────────────────────────────────────────────
const Journal = () => {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wellnest_journal') || '[]') }
    catch { return [] }
  })
  const [text, setText] = useState('')
  const [mood, setMood] = useState('')
  const prompts = [
    "What made you smile today?",
    "What's one thing you're grateful for?",
    "What's been weighing on your mind?",
    "What do you need most right now?",
    "What's one small victory from today?",
    "How did you take care of yourself today?",
  ]
  const [prompt] = useState(() => prompts[Math.floor(Math.random() * prompts.length)])

  const save = () => {
    if (!text.trim()) return
    const entry = { id: Date.now(), text, mood, date: new Date().toISOString(), prompt }
    const newEntries = [entry, ...entries].slice(0, 50)
    setEntries(newEntries)
    localStorage.setItem('wellnest_journal', JSON.stringify(newEntries))
    setText('')
    setMood('')
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-display text-xl text-slate-800 mb-4">Journal</h2>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
          <p className="text-sm text-amber-700 italic">✨ Prompt: "{prompt}"</p>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Start writing... Your thoughts are safe here."
          rows={5}
          className="input resize-none mb-3"
        />
        <div className="flex gap-2 flex-wrap mb-3">
          {['😊', '😔', '😤', '😰', '😌', '🤔'].map(e => (
            <button key={e} onClick={() => setMood(mood === e ? '' : e)}
              className={`text-xl p-1.5 rounded-xl transition-all ${mood === e ? 'bg-sky-100 scale-110' : 'hover:bg-slate-50'}`}>
              {e}
            </button>
          ))}
        </div>
        <button onClick={save} disabled={!text.trim()} className="btn-primary w-full">Save Entry</button>
      </div>

      {entries.length > 0 && (
        <div className="card">
          <h3 className="font-display text-lg text-slate-800 mb-3">Past Entries</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {entries.map(entry => (
              <div key={entry.id} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  {entry.mood && <span>{entry.mood}</span>}
                  <span className="text-xs text-slate-400">{new Date(entry.date).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-3">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Meditation Timer ──────────────────────────────────────────────
const Meditation = () => {
  const [duration, setDuration] = useState(5) // minutes
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)

  const start = () => {
    setDone(false)
    setRemaining(duration * 60)
    setRunning(true)
  }

  const stop = () => {
    setRunning(false)
    clearInterval(intervalRef.current)
    setRemaining(0)
  }

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          setDone(true)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Meditation Complete 🧘', { body: 'Well done! You completed your meditation session.' })
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const mins = Math.floor(remaining / 60).toString().padStart(2, '0')
  const secs = (remaining % 60).toString().padStart(2, '0')
  const progress = running ? ((duration * 60 - remaining) / (duration * 60)) * 100 : 0

  return (
    <div className="card flex flex-col items-center py-8 space-y-6">
      <div>
        <h2 className="font-display text-xl text-slate-800 text-center">Meditation Timer</h2>
        <p className="text-sm text-slate-500 text-center mt-1">Find stillness and calm your mind</p>
      </div>

      {done ? (
        <div className="text-center animate-slide-up">
          <div className="text-6xl mb-3">🌸</div>
          <h3 className="font-display text-2xl text-slate-800">Beautiful!</h3>
          <p className="text-slate-500 mt-1">You completed {duration} minutes of meditation</p>
          <button onClick={() => setDone(false)} className="btn-primary mt-4">Meditate Again</button>
        </div>
      ) : (
        <>
          {/* Timer display */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="88" cy="88" r="80" fill="none" stroke="#e0f2fe" strokeWidth="6" />
              <circle cx="88" cy="88" r="80" fill="none" stroke="#0ea5e9" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="text-center">
              <div className="font-mono text-4xl font-bold text-sky-700">{running ? `${mins}:${secs}` : `${duration}:00`}</div>
              <div className="text-xs text-slate-400 mt-1">{running ? 'remaining' : 'minutes'}</div>
            </div>
          </div>

          {/* Duration select */}
          {!running && (
            <div className="flex gap-2 flex-wrap justify-center">
              {[2, 5, 10, 15, 20].map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`w-12 h-12 rounded-xl text-sm font-medium transition-all ${
                    duration === d ? 'bg-sky-500 text-white shadow-soft' : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                  }`}
                >{d}m</button>
              ))}
            </div>
          )}

          <button onClick={running ? stop : start} className={running ? 'btn-secondary' : 'btn-primary'}>
            {running ? 'End Session' : 'Begin Meditation'}
          </button>

          <div className="text-center space-y-1 text-xs text-slate-400 max-w-xs">
            <p>Find a comfortable position. Close your eyes.</p>
            <p>Focus on your breath. Let thoughts pass like clouds.</p>
          </div>
        </>
      )}
    </div>
  )
}

// ── Resources ──────────────────────────────────────────────────────
const Resources = () => (
  <div className="space-y-3">
    <div className="card bg-rose-50 border border-rose-100">
      <h3 className="font-display text-lg text-rose-800 mb-3">🆘 Crisis Helplines (India)</h3>
      <div className="space-y-2">
        {[
          { name: 'iCall', number: '9152987821', hours: 'Mon-Sat 8am-10pm' },
          { name: 'Vandrevala Foundation', number: '1860-2662-345', hours: '24/7' },
          { name: 'Snehi', number: '044-24640050', hours: 'Daily 8am-10pm' },
          { name: 'Aasra', number: '9820466627', hours: '24/7' },
        ].map(h => (
          <a key={h.name} href={`tel:${h.number}`} className="flex items-center justify-between p-3 bg-white rounded-xl hover:shadow-sm transition-all">
            <div>
              <div className="font-medium text-slate-800 text-sm">{h.name}</div>
              <div className="text-xs text-slate-500">{h.hours}</div>
            </div>
            <div className="text-sky-600 font-mono text-sm">📞 {h.number}</div>
          </a>
        ))}
      </div>
    </div>
    <div className="card">
      <h3 className="font-display text-lg text-slate-800 mb-3">📚 Useful Resources</h3>
      <div className="space-y-2">
        {[
          { title: 'iCall Website', url: 'https://icallhelpline.org', desc: 'Free psycho-social support' },
          { title: 'NIMHANS', url: 'https://nimhans.ac.in', desc: 'National mental health institute' },
          { title: 'Vandrevala Foundation', url: 'https://www.vandrevalafoundation.com', desc: 'Free mental health services' },
        ].map(r => (
          <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl hover:bg-sky-100 transition-all">
            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-sky-600">↗</div>
            <div>
              <div className="font-medium text-slate-800 text-sm">{r.title}</div>
              <div className="text-xs text-slate-500">{r.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  </div>
)

// ── Main Page ─────────────────────────────────────────────────────
const TABS = [
  { id: 'breathe', label: '🌬️ Breathe', component: BreathingExercise },
  { id: 'journal', label: '📝 Journal', component: Journal },
  { id: 'meditate', label: '🧘 Meditate', component: Meditation },
  { id: 'resources', label: '🆘 Resources', component: Resources },
]

export default function SelfHelpPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'breathe'
  const [activeTab, setActiveTab] = useState(TABS.find(t => t.id === defaultTab)?.id || 'breathe')
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || BreathingExercise

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 page-enter">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="font-display text-3xl text-slate-800">{t('selfHelp')}</h1>
          <p className="text-slate-500 text-sm mt-1">Tools and exercises for your well-being</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-fade-in">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
