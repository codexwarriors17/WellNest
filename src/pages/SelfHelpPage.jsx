// src/pages/SelfHelpPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

// ── Breathing Exercise ─────────────────────────────────────────────
const BreathingExercise = () => {
  const [technique, setTechnique] = useState('4-4-6')
  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [count, setCount] = useState(0)
  const [cycles, setCycles] = useState(0)
  const timerRef = useRef(null)

  const TECHNIQUES = {
    '4-4-6': { name: '4-4-6 Calm', desc: 'Best for anxiety & stress',
      phases: [{ name: 'inhale', label: 'Breathe In', duration: 4 }, { name: 'hold', label: 'Hold', duration: 4 }, { name: 'exhale', label: 'Breathe Out', duration: 6 }] },
    '4-7-8': { name: '4-7-8 Sleep', desc: 'Deep relaxation & sleep',
      phases: [{ name: 'inhale', label: 'Breathe In', duration: 4 }, { name: 'hold', label: 'Hold', duration: 7 }, { name: 'exhale', label: 'Breathe Out', duration: 8 }] },
    'box': { name: 'Box Focus', desc: 'Focus & calm under pressure',
      phases: [{ name: 'inhale', label: 'Breathe In', duration: 4 }, { name: 'hold1', label: 'Hold In', duration: 4 }, { name: 'exhale', label: 'Breathe Out', duration: 4 }, { name: 'hold2', label: 'Hold Out', duration: 4 }] },
  }

  const phases = TECHNIQUES[technique].phases
  const currentPhase = phases[phaseIndex] || phases[0]

  const start = () => {
    setRunning(true); setPhaseIndex(0); setCount(phases[0].duration); setCycles(0)
    localStorage.setItem('wellnest_used_breathing', 'true')
  }
  const stop = () => { setRunning(false); clearInterval(timerRef.current); setCount(0); setPhaseIndex(0) }

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          setPhaseIndex(pi => {
            const next = (pi + 1) % phases.length
            if (next === 0) setCycles(c => c + 1)
            return next
          })
          return phases[(phaseIndex + 1) % phases.length].duration
        }
        return prev - 1
      })
    }, 1000)
    timerRef.current = iv
    return () => clearInterval(iv)
  }, [running, phaseIndex, technique])

  const circleScale = currentPhase.name === 'inhale' ? 'scale-125' : currentPhase.name.includes('exhale') ? 'scale-75' : 'scale-100'

  return (
    <div className="card flex flex-col items-center py-8 space-y-5">
      <div className="text-center">
        <h2 className="font-display text-xl text-slate-800">Breathing Exercise</h2>
        <p className="text-sm text-slate-500 mt-1">{TECHNIQUES[technique].desc}</p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {Object.entries(TECHNIQUES).map(([key, val]) => (
          <button key={key} onClick={() => { setTechnique(key); stop() }}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${technique === key ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-50'}`}>
            {val.name}
          </button>
        ))}
      </div>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-sky-100/50" />
        <div className={`absolute w-32 h-32 rounded-full bg-gradient-to-br from-sky-300 to-sky-500 transition-transform duration-1000 ease-in-out ${running ? circleScale : 'scale-100'}`} />
        <div className="relative text-center z-10">
          {running ? (
            <><div className="text-3xl font-bold text-white drop-shadow">{count}</div>
            <div className="text-xs text-white/90 font-semibold mt-0.5">{currentPhase.label}</div>
            <div className="text-xs text-white/70 mt-0.5">cycle {cycles + 1}</div></>
          ) : <div className="text-4xl">🌿</div>}
        </div>
      </div>
      <button onClick={running ? stop : start} className={running ? 'btn-secondary' : 'btn-primary'}>
        {running ? 'Stop' : 'Start Breathing'}
      </button>
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
        {phases.map(p => (
          <div key={p.name} className={`p-2 rounded-xl text-center text-xs transition-all ${running && currentPhase.name === p.name ? 'bg-sky-100 text-sky-700 font-semibold' : 'bg-slate-50 text-slate-500'}`}>
            <div className="font-medium">{p.label}</div><div>{p.duration}s</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Journal ────────────────────────────────────────────────────────
const Journal = () => {
  const [entries, setEntries] = useState(() => { try { return JSON.parse(localStorage.getItem('wellnest_journal') || '[]') } catch { return [] } })
  const [text, setText] = useState('')
  const [mood, setMood] = useState('')
  const [view, setView] = useState('write')
  const PROMPTS = ["What made you smile today?","What's one thing you're grateful for?","What's been weighing on your mind?","What do you need most right now?","What's one small victory from today?","Write a letter to your future self."]
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)])

  const save = () => {
    if (!text.trim()) return
    const entry = { id: Date.now(), text, mood, date: new Date().toISOString(), prompt }
    const updated = [entry, ...entries].slice(0, 100)
    setEntries(updated); localStorage.setItem('wellnest_journal', JSON.stringify(updated))
    localStorage.setItem('wellnest_used_journal', 'true'); setText(''); setMood('')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card w-fit">
        {['write', 'history'].map(v => (
          <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${v === view ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {v === 'write' ? '✏️ Write' : `📚 History (${entries.length})`}
          </button>
        ))}
      </div>
      {view === 'write' ? (
        <div className="card space-y-4 animate-fade-in">
          <h2 className="font-display text-xl text-slate-800">Daily Journal</h2>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-3">
            <p className="text-sm text-amber-700 italic">✨ "{prompt}"</p>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Start writing... Your thoughts are safe here." rows={5} className="input resize-none" />
          <div>
            <p className="text-xs text-slate-500 mb-2">How are you feeling right now?</p>
            <div className="flex gap-2 flex-wrap">
              {['😊','😔','😤','😰','😌','🤔','😴','🥹'].map(e => (
                <button key={e} onClick={() => setMood(mood === e ? '' : e)} className={`text-2xl p-1.5 rounded-xl transition-all ${mood === e ? 'bg-sky-100 scale-110 ring-2 ring-sky-300' : 'hover:bg-slate-50'}`}>{e}</button>
              ))}
            </div>
          </div>
          <button onClick={save} disabled={!text.trim()} className="btn-primary w-full disabled:opacity-40">Save Entry 📝</button>
        </div>
      ) : (
        <div className="card animate-fade-in">
          <h2 className="font-display text-lg text-slate-800 mb-4">Your Entries</h2>
          {entries.length === 0 ? <div className="text-center py-8 text-slate-400">No entries yet. Start writing! ✏️</div> : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {entries.map(entry => (
                <div key={entry.id} className="p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    {entry.mood && <span className="text-xl">{entry.mood}</span>}
                    <span className="text-xs text-slate-400">{new Date(entry.date).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{entry.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Meditation ─────────────────────────────────────────────────────
const Meditation = () => {
  const [duration, setDuration] = useState(5)
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)

  const start = () => { setDone(false); setRemaining(duration * 60); setRunning(true) }
  const stop = () => { setRunning(false); clearInterval(intervalRef.current); setRemaining(0) }

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); setRunning(false); setDone(true); return 0 }
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
      <div className="text-center">
        <h2 className="font-display text-xl text-slate-800">Meditation Timer</h2>
        <p className="text-sm text-slate-500 mt-1">Stillness is a superpower</p>
      </div>
      {done ? (
        <div className="text-center animate-slide-up space-y-3">
          <div className="text-6xl animate-float">🌸</div>
          <h3 className="font-display text-2xl text-slate-800">Beautifully done!</h3>
          <p className="text-slate-500">You completed {duration} minutes 🙏</p>
          <button onClick={() => setDone(false)} className="btn-primary">Meditate Again</button>
        </div>
      ) : (
        <>
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="88" cy="88" r="80" fill="none" stroke="#e0f2fe" strokeWidth="6" />
              <circle cx="88" cy="88" r="80" fill="none" stroke="#0ea5e9" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress / 100)}`}
                className="transition-all duration-1000" strokeLinecap="round" />
            </svg>
            <div className="text-center">
              <div className="font-mono text-4xl font-bold text-sky-700">{running ? `${mins}:${secs}` : `${duration}:00`}</div>
              <div className="text-xs text-slate-400 mt-1">{running ? 'remaining' : 'minutes'}</div>
            </div>
          </div>
          {!running && (
            <div className="flex gap-2 flex-wrap justify-center">
              {[2, 5, 10, 15, 20, 30].map(d => (
                <button key={d} onClick={() => setDuration(d)} className={`w-12 h-12 rounded-xl text-sm font-medium transition-all ${duration === d ? 'bg-sky-500 text-white shadow-soft' : 'bg-slate-100 text-slate-600 hover:bg-sky-50'}`}>{d}m</button>
              ))}
            </div>
          )}
          <button onClick={running ? stop : start} className={running ? 'btn-secondary' : 'btn-primary'}>
            {running ? 'End Session' : 'Begin Meditation'}
          </button>
          <p className="text-xs text-slate-400 text-center max-w-xs">Find a comfortable position · Close your eyes · Focus on your breath</p>
        </>
      )}
    </div>
  )
}

// ── Yoga ───────────────────────────────────────────────────────────
const YOGA_POSES = [
  { name: "Child's Pose", emoji: '🧘', duration: '30-60s', benefit: 'Releases back & shoulder tension', steps: ['Start on hands and knees','Sit back onto your heels','Extend arms forward, rest forehead on mat','Breathe deeply and relax'] },
  { name: 'Cat-Cow Stretch', emoji: '🐱', duration: '1-2 min', benefit: 'Relieves spine tension & anxiety', steps: ['Start on hands and knees','Inhale: arch back, lift head (Cow)','Exhale: round spine, tuck chin (Cat)','Repeat slowly 10 times'] },
  { name: 'Forward Fold', emoji: '🙆', duration: '30-60s', benefit: 'Calms the nervous system', steps: ['Stand with feet hip-width apart','Slowly bend forward from hips','Let arms hang or grab elbows','Hold and breathe deeply'] },
  { name: 'Legs Up the Wall', emoji: '🦵', duration: '5-10 min', benefit: 'Reduces anxiety & fatigue', steps: ['Lie near a wall','Swing legs up against the wall','Arms relaxed at sides','Close eyes and breathe slowly'] },
  { name: 'Corpse Pose', emoji: '💆', duration: '5-10 min', benefit: 'Deep relaxation & stress relief', steps: ['Lie flat on your back','Let feet fall open naturally','Arms slightly away from body','Close eyes, breathe naturally'] },
]

const Yoga = () => {
  const [selected, setSelected] = useState(null)

  return (
    <div className="card space-y-4">
      <h2 className="font-display text-xl text-slate-800">Yoga & Stretches</h2>
      <p className="text-sm text-slate-500">Simple poses for mental & physical relief. Tap to expand.</p>
      <div className="space-y-3">
        {YOGA_POSES.map(pose => (
          <div key={pose.name} onClick={() => setSelected(selected?.name === pose.name ? null : pose)}
            className="p-4 bg-slate-50 hover:bg-sky-50 rounded-2xl cursor-pointer transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{pose.emoji}</span>
                <div>
                  <div className="font-semibold text-slate-700 text-sm">{pose.name}</div>
                  <div className="text-xs text-slate-400">{pose.duration} · {pose.benefit}</div>
                </div>
              </div>
              <span className="text-slate-300">{selected?.name === pose.name ? '▲' : '▼'}</span>
            </div>
            {selected?.name === pose.name && (
              <div className="mt-4 pl-10 animate-slide-up">
                <ol className="space-y-2">
                  {pose.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="w-5 h-5 bg-sky-100 text-sky-600 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Affirmations ───────────────────────────────────────────────────
const AFFIRMATIONS = [
  { category: '💪 Strength', items: ['I am stronger than my struggles.','I have overcome hard things before.','My resilience grows every day.','I am capable of handling whatever comes.'] },
  { category: '💙 Self-Love', items: ['I am worthy of love and care.','I deserve to take up space.','My feelings are valid.','I am enough, exactly as I am.'] },
  { category: '🌱 Growth', items: ['I am growing and healing every day.','Every small step forward matters.','I am becoming the person I want to be.','Progress, not perfection.'] },
  { category: '🧘 Peace', items: ['I release what I cannot control.','I choose peace over anxiety.','I am safe in this moment.','My mind can find stillness.'] },
  { category: '🌟 Hope', items: ['Better days are coming.','I am not alone in my journey.','My story is not over.','I carry hope within me.'] },
]

const Affirmations = () => {
  const [category, setCategory] = useState(0)
  const [affIdx, setAffIdx] = useState(0)
  const [saved, setSaved] = useState(() => { try { return JSON.parse(localStorage.getItem('wellnest_affirmations') || '[]') } catch { return [] } })
  const current = AFFIRMATIONS[category].items[affIdx]

  const next = () => setAffIdx(i => (i + 1) % AFFIRMATIONS[category].items.length)
  const saveAff = () => {
    if (saved.includes(current)) return
    const updated = [current, ...saved].slice(0, 20)
    setSaved(updated); localStorage.setItem('wellnest_affirmations', JSON.stringify(updated))
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-5">
        <h2 className="font-display text-xl text-slate-800">Daily Affirmations</h2>
        <div className="flex gap-2 flex-wrap">
          {AFFIRMATIONS.map((cat, i) => (
            <button key={i} onClick={() => { setCategory(i); setAffIdx(0) }}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${category === i ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-50'}`}>
              {cat.category}
            </button>
          ))}
        </div>
        <div className="bg-gradient-to-br from-sky-50 to-violet-50 border border-sky-100 rounded-2xl p-8 text-center min-h-[120px] flex items-center justify-center">
          <p className="font-display text-xl text-slate-800 leading-relaxed italic">"{current}"</p>
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={saveAff} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-sky-50 text-sm font-medium transition-all">🔖 Save</button>
          <button onClick={next} className="btn-primary py-2 px-5 text-sm">Next →</button>
        </div>
      </div>
      {saved.length > 0 && (
        <div className="card">
          <h3 className="font-display text-lg text-slate-800 mb-3">🔖 Saved</h3>
          <div className="space-y-2">
            {saved.map((aff, i) => <div key={i} className="p-3 bg-sky-50 rounded-xl text-sm text-sky-800 italic">"{aff}"</div>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Resources ──────────────────────────────────────────────────────
const Resources = () => (
  <div className="space-y-3">
    <div className="card bg-rose-50 border border-rose-100">
      <h3 className="font-display text-lg text-rose-800 mb-3">🆘 Crisis Helplines</h3>
      <div className="space-y-2">
        {[{name:'iCall',number:'9152987821',hours:'Mon-Sat 8am-10pm'},{name:'Vandrevala Foundation',number:'1860-2662-345',hours:'24/7'},{name:'Snehi',number:'044-24640050',hours:'Daily 8am-10pm'},{name:'Aasra',number:'9820466627',hours:'24/7'}].map(h => (
          <a key={h.name} href={`tel:${h.number}`} className="flex items-center justify-between p-3 bg-white rounded-xl hover:shadow-sm transition-all">
            <div><div className="font-medium text-slate-800 text-sm">{h.name}</div><div className="text-xs text-slate-500">{h.hours}</div></div>
            <div className="text-sky-600 font-mono text-sm">📞 {h.number}</div>
          </a>
        ))}
      </div>
    </div>
  </div>
)

// ── Main ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'breathe', label: '🌬️', full: 'Breathe', component: BreathingExercise },
  { id: 'journal', label: '📝', full: 'Journal', component: Journal },
  { id: 'meditate', label: '🧘', full: 'Meditate', component: Meditation },
  { id: 'yoga', label: '🤸', full: 'Yoga', component: Yoga },
  { id: 'affirmations', label: '💬', full: 'Affirm', component: Affirmations },
  { id: 'resources', label: '🆘', full: 'Help', component: Resources },
]

export default function SelfHelpPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'breathe'
  const [activeTab, setActiveTab] = useState(TABS.find(tb => tb.id === defaultTab)?.id || 'breathe')
  const ActiveComponent = TABS.find(tb => tb.id === activeTab)?.component || BreathingExercise

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 page-enter">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="font-display text-3xl text-slate-800">{t('selfHelp')}</h1>
          <p className="text-slate-500 text-sm mt-1">Tools and exercises for your well-being</p>
        </div>
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 whitespace-nowrap px-2 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center gap-0.5 ${activeTab === tab.id ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span>{tab.label}</span>
              <span className="text-xs">{tab.full}</span>
            </button>
          ))}
        </div>
        <div className="animate-fade-in"><ActiveComponent /></div>
      </div>
    </div>
  )
}
