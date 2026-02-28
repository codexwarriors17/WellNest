// src/services/moodService.js
export const MOODS = [
  { id: 'great', emoji: '😄', label: 'Great', color: '#22c55e', bgColor: '#dcfce7', value: 5 },
  { id: 'good', emoji: '🙂', label: 'Good', color: '#0ea5e9', bgColor: '#e0f2fe', value: 4 },
  { id: 'neutral', emoji: '😐', label: 'Okay', color: '#f59e0b', bgColor: '#fef9c3', value: 3 },
  { id: 'sad', emoji: '😔', label: 'Sad', color: '#6366f1', bgColor: '#eef2ff', value: 2 },
  { id: 'terrible', emoji: '😢', label: 'Terrible', color: '#f43f5e', bgColor: '#ffe4e6', value: 1 },
]

export const getMoodById = (id) => MOODS.find(m => m.id === id)

export const getMoodColor = (id) => {
  const mood = getMoodById(id)
  return mood ? mood.color : '#0ea5e9'
}

export const getMoodEmoji = (id) => {
  const mood = getMoodById(id)
  return mood ? mood.emoji : '😐'
}

export const getMoodValue = (id) => {
  const mood = getMoodById(id)
  return mood ? mood.value : 3
}

export const prepareMoodChartData = (logs) => {
  return logs
    .slice(0, 14)
    .reverse()
    .map(log => ({
      date: log.timestamp?.toDate
        ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(log.timestamp.toDate())
        : 'N/A',
      value: getMoodValue(log.mood),
      mood: log.mood,
      emoji: getMoodEmoji(log.mood),
    }))
}
