// src/hooks/useNetworkStatus.js
// Tracks online/offline status using browser events.
// Also detects Firestore sync state (pending writes).

import { useEffect, useState, useCallback } from 'react'
import { onSnapshot, collection, query, where, limit } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

/**
 * Returns { isOnline, wasOffline, syncPending }
 *
 * isOnline      - current browser network status
 * wasOffline    - true if user went offline this session (shows sync banner on reconnect)
 * syncPending   - true if Firestore has pending writes (queued offline)
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline]       = useState(navigator.onLine)
  const [wasOffline, setWasOffline]   = useState(false)
  const [syncPending, setSyncPending] = useState(false)

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    // Keep wasOffline true briefly so banner shows "Back online, syncing..."
    setTimeout(() => setWasOffline(false), 4000)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setWasOffline(true)
  }, [])

  useEffect(() => {
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // ── Firestore pending writes detection ────────────────────────────────────
  // Firestore SDK fires onSnapshot with `fromCache: true` + `hasPendingWrites: true`
  // when there are locally queued writes not yet synced to server.
  // We use the __FIREBASE_PENDING_WRITES__ workaround since there's no direct API.
  // Instead we use window.__wellnest_pendingWrites set by moodService writes.
  useEffect(() => {
    const check = () => {
      setSyncPending(window.__wellnest_pendingWrites > 0)
    }
    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [])

  return { isOnline, wasOffline, syncPending }
}