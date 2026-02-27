// src/hooks/useFCM.js
// No JSX in this file — plain JS only (Vite requires .jsx for JSX syntax)

import { useEffect, useState, useRef, useCallback } from 'react'
import { onMessage } from 'firebase/messaging'
import { getMessagingInstance } from '../firebase/firebaseConfig'
import { requestNotificationPermission } from '../firebase/firebaseMessaging'
import toast from 'react-hot-toast'

/**
 * @param {string|null} uid - Firebase Auth uid (null = not signed in yet)
 */
export function useFCM(uid) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [fcmToken, setFcmToken] = useState(null)
  const unsubRef = useRef(null)

  // ── Foreground message listener ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const subscribe = async () => {
      const messaging = await getMessagingInstance()
      if (!messaging || cancelled) return

      // Clean up previous listener
      if (unsubRef.current) unsubRef.current()

      unsubRef.current = onMessage(messaging, (payload) => {
        const { title, body } = payload.notification || {}
        const type = payload.data?.type

        const icon = type === 'mood_alert' ? '🆘' : '🌙'
        const targetUrl =
          type === 'mood_alert' ? '/dashboard' :
          type === 'daily_reminder' ? '/mood' : '/'

        // Plain toast — no JSX needed
        toast(
          icon + ' ' + (title || 'WellNest') + ': ' + (body || 'Tap to open'),
          {
            duration: 6000,
            style: { cursor: 'pointer' },
            onClick: () => { window.location.href = targetUrl },
          }
        )
      })
    }

    subscribe()

    return () => {
      cancelled = true
      if (unsubRef.current) unsubRef.current()
    }
  }, [uid])

  // ── Request permission + get token ────────────────────────────────────
  const requestPermission = useCallback(async () => {
    if (!uid) return null
    const token = await requestNotificationPermission(uid)
    const newPermission = typeof Notification !== 'undefined'
      ? Notification.permission
      : 'default'
    setPermission(newPermission)
    if (token) setFcmToken(token)
    return token
  }, [uid])

  // ── Auto-fetch token if already granted (returning user) ──────────────
  useEffect(() => {
    if (uid && permission === 'granted' && !fcmToken) {
      requestPermission()
    }
  }, [uid, permission]) // eslint-disable-line

  return { permission, fcmToken, requestPermission }
}
