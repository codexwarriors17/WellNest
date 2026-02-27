
// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/firebaseConfig'
import { createUserProfile, getUserProfile } from '../firebase/firebaseFunctions'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      try {
        if (firebaseUser) {
          // 1) Get profile
          let p = await getUserProfile(firebaseUser.uid)

          // 2) If missing, create it (important for new users / anonymous users)
          if (!p) {
            await createUserProfile(firebaseUser, {
              language: 'en',
              isAnonymous: !!firebaseUser.isAnonymous,
            })
            p = await getUserProfile(firebaseUser.uid)
          }

          setProfile(p)
        } else {
          setProfile(null)
        }
      } catch (err) {
        console.error('AuthContext profile load error:', err)
        // Don’t crash app, just keep profile null
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsub()
  }, [])

  const refreshProfile = async () => {
    if (!user) return
    try {
      const p = await getUserProfile(user.uid)
      setProfile(p)
    } catch (err) {
      console.error('refreshProfile error:', err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAnonymous: !!user?.isAnonymous,
        refreshProfile,
      }}
    >
      {/* Prevent UI flicker */}
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}