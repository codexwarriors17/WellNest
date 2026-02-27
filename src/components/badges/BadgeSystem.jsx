// src/components/badges/BadgeSystem.jsx
import { useMemo } from 'react'

export const BADGES = [
  // Streak badges
  { id: 'first_log', emoji: '🌱', name: 'First Step', desc: 'Logged your first mood', condition: (stats) => stats.totalLogs >= 1, color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
  { id: 'streak_3', emoji: '🔥', name: 'On Fire', desc: '3-day streak', condition: (stats) => stats.streak >= 3, color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700' },
  { id: 'streak_7', emoji: '⚡', name: 'Week Warrior', desc: '7-day streak', condition: (stats) => stats.streak >= 7, color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
  { id: 'streak_14', emoji: '🌟', name: 'Fortnight Hero', desc: '14-day streak', condition: (stats) => stats.streak >= 14, color: 'bg-sky-50 border-sky-200', textColor: 'text-sky-700' },
  { id: 'streak_30', emoji: '👑', name: 'Monthly Master', desc: '30-day streak', condition: (stats) => stats.streak >= 30, color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
  // Log count badges
  { id: 'logs_10', emoji: '📊', name: 'Tracker', desc: '10 mood logs', condition: (stats) => stats.totalLogs >= 10, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
  { id: 'logs_50', emoji: '🏆', name: 'Dedicated', desc: '50 mood logs', condition: (stats) => stats.totalLogs >= 50, color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  { id: 'logs_100', emoji: '💎', name: 'Diamond Mind', desc: '100 mood logs', condition: (stats) => stats.totalLogs >= 100, color: 'bg-cyan-50 border-cyan-200', textColor: 'text-cyan-700' },
  // Mood badges
  { id: 'positive_week', emoji: '☀️', name: 'Sunshine Week', desc: '7 positive mood days', condition: (stats) => stats.positiveDays >= 7, color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
  { id: 'resilient', emoji: '💪', name: 'Resilient', desc: 'Logged mood after a bad day', condition: (stats) => stats.loggedAfterBadDay, color: 'bg-rose-50 border-rose-200', textColor: 'text-rose-700' },
  // Feature badges
  { id: 'breathed', emoji: '🧘', name: 'Zen Starter', desc: 'Used breathing exercise', condition: (stats) => stats.usedBreathing, color: 'bg-teal-50 border-teal-200', textColor: 'text-teal-700' },
  { id: 'journaled', emoji: '📝', name: 'Reflector', desc: 'Wrote a journal entry', condition: (stats) => stats.usedJournal, color: 'bg-indigo-50 border-indigo-200', textColor: 'text-indigo-700' },
]

export const computeBadges = (stats) => {
  return BADGES.map(badge => ({
    ...badge,
    earned: badge.condition(stats),
  }))
}

export const BadgeCard = ({ badge, size = 'md' }) => {
  const isSmall = size === 'sm'
  return (
    <div className={`border-2 rounded-2xl flex flex-col items-center text-center transition-all duration-200
      ${badge.earned ? `${badge.color} ${badge.textColor}` : 'bg-slate-50 border-slate-100 opacity-40 grayscale'}
      ${isSmall ? 'p-2 gap-1' : 'p-4 gap-2'}
    `}>
      <span className={isSmall ? 'text-2xl' : 'text-3xl'}>{badge.emoji}</span>
      <div>
        <div className={`font-semibold ${isSmall ? 'text-xs' : 'text-sm'}`}>{badge.name}</div>
        {!isSmall && <div className="text-xs opacity-70 mt-0.5">{badge.desc}</div>}
      </div>
      {badge.earned && !isSmall && (
        <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full font-medium">Earned ✓</span>
      )}
    </div>
  )
}

export default function BadgeSystem({ stats }) {
  const badges = useMemo(() => computeBadges(stats || {}), [stats])
  const earned = badges.filter(b => b.earned)
  const locked = badges.filter(b => !b.earned)

  return (
    <div className="space-y-6">
      {/* Earned */}
      {earned.length > 0 && (
        <div>
          <h3 className="font-display text-lg text-slate-800 mb-3">
            🏆 Earned Badges <span className="text-sm font-body font-normal text-slate-400 ml-1">({earned.length})</span>
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {earned.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
          </div>
        </div>
      )}

      {/* Locked */}
      <div>
        <h3 className="font-display text-lg text-slate-800 mb-3">
          🔒 Locked <span className="text-sm font-body font-normal text-slate-400 ml-1">({locked.length})</span>
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {locked.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
        </div>
      </div>
    </div>
  )
}
