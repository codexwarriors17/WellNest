// src/components/OfflineBanner.jsx
// Compact status banner that appears at the top when offline or syncing.
// Disappears automatically when back online and synced.

import { useEffect, useState } from 'react'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

export default function OfflineBanner() {
  const { isOnline, wasOffline, syncPending } = useNetworkStatus()
  const [visible, setVisible] = useState(false)
  const [status,  setStatus]  = useState('offline') // 'offline' | 'syncing' | 'synced'

  useEffect(() => {
    if (!isOnline) {
      setStatus('offline')
      setVisible(true)
    } else if (wasOffline && syncPending) {
      setStatus('syncing')
      setVisible(true)
    } else if (wasOffline && !syncPending) {
      setStatus('synced')
      setVisible(true)
      // Auto-hide after 3s
      const t = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [isOnline, wasOffline, syncPending])

  if (!visible) return null

  const configs = {
    offline: {
      bg:   'bg-slate-800',
      text: 'text-white',
      icon: '📵',
      msg:  "You're offline — data is cached locally and will sync when you reconnect.",
    },
    syncing: {
      bg:   'bg-amber-500',
      text: 'text-white',
      icon: '🔄',
      msg:  'Back online — syncing your data...',
    },
    synced: {
      bg:   'bg-emerald-500',
      text: 'text-white',
      icon: '✅',
      msg:  'All data synced!',
    },
  }

  const cfg = configs[status]

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[9999] ${cfg.bg} ${cfg.text}
        flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium
        transition-all duration-300 safe-top`}
      style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.msg}</span>
      {status === 'syncing' && (
        <svg className="animate-spin h-3 w-3 ml-1" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
    </div>
  )
}
