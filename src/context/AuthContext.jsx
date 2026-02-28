// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/firebaseConfig'
import { getUserProfile, logout as firebaseLogout } from '../firebase/firebaseFunctions'
import { refreshFCMToken, deleteFCMToken } from '../firebase/firebaseMessaging'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          const p = await getUserProfile(firebaseUser.uid)
          setProfile(p)

          // ── Auto-refresh FCM token on app load if permission already granted ──
          // This keeps the token fresh without prompting the user again.
          if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted' &&
            p?.reminderEnabled !== false   // don't refresh if user has opted out
          ) {
            refreshFCMToken(firebaseUser.uid).catch(() => {})
          }
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return unsub
  }, [])

  const refreshProfile = async () => {
    if (user) {
      const p = await getUserProfile(user.uid)
      setProfile(p)
    }
  }

  /**
   * Logout: delete FCM token first, then sign out.
   * This ensures push reminders stop immediately on logout.
   */
  const logout = async () => {
    if (user?.uid) {
      // Delete FCM token silently — don't block logout on failure
      await deleteFCMToken(user.uid).catch(() => {})
    }
    await firebaseLogout()
  }

  // Convenience flag — true when signed in via signInAnonymously()
  const isAnonymous = !!user?.isAnonymous

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, refreshProfile, logout, isAnonymous }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
