// src/App.jsx
import { BrowserRouter, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import AppRouter from './routes/AppRouter'
import OnboardingFlow from './components/onboarding/OnboardingFlow'
import { useState, useEffect } from 'react'

function AppContent() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!loading && user && profile) {
      const localOnboarded = localStorage.getItem('wellnest_onboarded')
      if (!profile.onboarded && !localOnboarded) {
        setShowOnboarding(true)
      }
    }
  }, [user, profile, loading])

  const hideNavbar = ['/login'].includes(location.pathname)

  return (
    <>
      {!hideNavbar && <Navbar />}
      <AppRouter />
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#0ea5e9', secondary: '#fff' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
