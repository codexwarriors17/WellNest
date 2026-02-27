// src/components/MoodTracker.jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { saveMoodLog } from '../firebase/firebaseFunctions'
import { MOODS } from '../services/moodService'
import toast from 'react-hot-toast'

export default function MoodTracker({ onMoodSaved }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!selected) return toast.error('Please select how you feel first')
    if (!user) return toast.error('Please sign in to save your mood')
    setLoading(true)
    try {
      await saveMoodLog(user.uid, { mood: selected.id, note: note.trim() })
      setSaved(true)
      toast.success(t('moodSaved'))
      setTimeout(() => { setSaved(false); setSelected(null); setNote('') }, 1800)
      onMoodSaved?.()
    } catch { toast.error(t('errorOccurred')) }
    setLoading(false)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-10 animate-pop-in">
        <div className="text-5xl mb-3">{selected?.emoji}</div>
        <h3 className="font-display text-xl text-slate-800 mb-1">Mood logged! 🌿</h3>
        <p className="text-sm text-slate-500">Keep it up, you're doing great.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-xl text-slate-800 mb-0.5">{t('howAreYou')}</h3>
        <p className="text-xs text-slate-400">Tap an emoji to select your mood</p>
      </div>

      {/* Mood buttons */}
      <div className="flex justify-between gap-2">
        {MOODS.map(mood => (
          <button key={mood.id} onClick={() => setSelected(mood)}
            className={`mood-btn flex-1 flex flex-col items-center gap-2 py-3 px-1 rounded-2xl border-2 transition-all duration-200 ${
              selected?.id === mood.id
                ? 'border-current shadow-lg'
                : 'border-transparent bg-slate-50 hover:bg-white hover:shadow-sm'
            }`}
            style={selected?.id === mood.id ? { borderColor: mood.color, backgroundColor: mood.bgColor } : {}}
          >
            <span className="text-2xl leading-none">{mood.emoji}</span>
            <span className={`text-[10px] font-semibold leading-none ${selected?.id === mood.id ? 'text-slate-700' : 'text-slate-400'}`}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>

      {/* Note — only shows after mood selected */}
      {selected && (
        <div className="animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{selected.emoji}</span>
            <span className="text-sm font-semibold text-slate-700">Feeling {selected.label}</span>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="What's on your mind? (optional)"
            rows={3} maxLength={300}
            className="input resize-none text-sm"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-slate-400">{note.length}/300</span>
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={!selected || loading}
        className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
          selected ? 'btn-gradient' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Saving...
          </span>
        ) : `Save Mood ${selected?.emoji || ''}`}
      </button>
    </div>
  )
}
