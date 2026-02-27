// src/components/MoodTracker.jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { saveMoodLog } from '../firebase/firebaseFunctions'
import { MOODS } from '../services/moodService'
import Button from './Button'
import toast from 'react-hot-toast'

export default function MoodTracker({ onMoodSaved }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [selectedMood, setSelectedMood] = useState(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!selectedMood) return toast.error('Please select a mood first')
    if (!user) return toast.error('Please sign in to save your mood')

    setLoading(true)
    try {
      await saveMoodLog(user.uid, { mood: selectedMood.id, note: note.trim() })
      toast.success(t('moodSaved'))
      setSelectedMood(null)
      setNote('')
      onMoodSaved?.()
    } catch (err) {
      toast.error(t('errorOccurred'))
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl text-slate-800 mb-1">{t('howAreYou')}</h3>
        <p className="text-sm text-slate-500">Tap to select your current mood</p>
      </div>

      {/* Mood buttons */}
      <div className="flex justify-between gap-2">
        {MOODS.map(mood => (
          <button
            key={mood.id}
            onClick={() => setSelectedMood(mood)}
            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 ${
              selectedMood?.id === mood.id
                ? 'border-current shadow-md scale-105'
                : 'border-transparent bg-slate-50 hover:bg-slate-100'
            }`}
            style={selectedMood?.id === mood.id
              ? { borderColor: mood.color, backgroundColor: mood.bgColor }
              : {}
            }
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className={`text-xs font-medium ${selectedMood?.id === mood.id ? 'text-slate-700' : 'text-slate-500'}`}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>

      {/* Note */}
      {selectedMood && (
        <div className="animate-slide-up">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t('noteOptional')}
            rows={3}
            className="input resize-none"
            maxLength={300}
          />
          <div className="text-right text-xs text-slate-400 mt-1">{note.length}/300</div>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={!selectedMood}
        loading={loading}
        className="w-full"
        size="lg"
      >
        {t('saveMood')}
      </Button>
    </div>
  )
}
