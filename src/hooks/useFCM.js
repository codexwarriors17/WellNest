// src/hooks/useFCM.js
// Plain JS only — no JSX (Vite requires .jsx for JSX syntax)

import { useEffect, useState, useRef, useCallback } from 'react'
import { subscribeForegroundMessages, refreshFCMToken, requestNotificationPermission } from '../firebase/firebaseMessaging'
import toast from 'react-hot-toast'

/**
 * Manages FCM: foreground notifications, token requests, and auto-refresh.
 *
 * @param {string|null} uid - Firebase Auth uid (null = not signed in)
 */
export function useFCM(uid) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [fcmToken, setFcmToken] = useState(null)
  const unsubRef = useRef(null)

  // ── Foreground message listener ──────────────────────────────────────────
  useEffect(() => {
    if (!uid) return

    let cancelled = false

    const subscribe = async () => {
      // Clean up any previous listener first
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }

      const unsub = await subscribeForegroundMessages((payload) => {
        if (cancelled) return

        const { title, body } = payload.notification || {}
        const type = payload.data?.type

        const icon = type === 'mood_alert' ? '🆘' : '🌙'
        const targetPath =
          type === 'mood_alert'     ? '/dashboard' :
          type === 'daily_reminder' ? '/mood'      : '/'

        const toastTitle = title || 'WellNest'
        const toastBody  = body  || 'Tap to open'

        // react-hot-toast: use toast() with a custom message string.
        // For click navigation, use onClick on the container via custom render.
        toast(
          (t) => {
            // Create a span and attach the click handler via a closure.
            // We return a plain string-compatible message — react-hot-toast
            // accepts a render function for full control.
            const el = document.createElement('span')
            el.textContent = `${icon} ${toastTitle}: ${toastBody}`
            el.style.cursor = 'pointer'
            el.addEventListener('click', () => {
              toast.dismiss(t.id)
              window.location.href = targetPath
            })
            return el
          },
          { duration: 6000 }
        )
      })

      if (!cancelled && unsub) {
        unsubRef.current = unsub
      }
    }

    subscribe()

    return () => {
      cancelled = true
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [uid])

  // ── Request permission + get token ───────────────────────────────────────
  const requestPermission = useCallback(async () => {
    if (!uid) return null
    const token = await requestNotificationPermission(uid)
    const newPermission =
      typeof Notification !== 'undefined' ? Notification.permission : 'default'
    setPermission(newPermission)
    if (token) setFcmToken(token)
    return token
  }, [uid])

  // ── Auto-refresh token for returning users (permission already granted) ──
  useEffect(() => {
    if (!uid) return
    if (permission !== 'granted') return
    if (fcmToken) return  // Already have a token this session

    // Silently refresh — no UI needed, just keep Firestore token fresh
    refreshFCMToken(uid).then((token) => {
      if (token) setFcmToken(token)
    })
  }, [uid, permission]) // eslint-disable-line react-hooks/exhaustive-deps

  return { permission, fcmToken, requestPermission }
}