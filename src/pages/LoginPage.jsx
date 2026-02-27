// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { registerWithEmail, loginWithEmail, loginWithGoogle, resetPassword } from '../firebase/firebaseFunctions'
import Button from '../components/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'reset'
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '' })

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await loginWithEmail(form.email, form.password)
        toast.success(`${t('welcomeBack')}! 🌿`)
        navigate('/dashboard')
      } else if (mode === 'register') {
        await registerWithEmail(form.email, form.password, form.name)
        toast.success('Account created! Welcome to WellNest 🌸')
        navigate('/dashboard')
      } else {
        await resetPassword(form.email)
        toast.success('Password reset email sent!')
        setMode('login')
      }
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : err.code === 'auth/email-already-in-use' ? 'Email already in use'
        : err.code === 'auth/weak-password' ? 'Password must be at least 6 characters'
        : t('errorOccurred')
      toast.error(msg)
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      toast.success('Signed in with Google! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(t('errorOccurred'))
    }
    setGoogleLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 flex items-center justify-center px-4 py-20 page-enter">
      {/* Background blobs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-sky-100/60 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-sage-50/80 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center shadow-soft">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
          </Link>
          <h1 className="font-display text-3xl text-slate-800">
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Reset password'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'login' ? 'Your wellness journey continues here' : mode === 'register' ? 'Start your mental wellness journey' : 'Enter your email to reset'}
          </p>
        </div>

        <div className="card shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">{t('displayName')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  required
                  placeholder="Your name"
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">{t('emailAddress')}</label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-slate-700">{t('password')}</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('reset')} className="text-xs text-sky-500 hover:underline">
                      {t('forgotPassword')}
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  required
                  placeholder="••••••••"
                  className="input"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === 'login' ? t('login') : mode === 'register' ? t('register') : 'Send Reset Email'}
            </Button>
          </form>

          {mode !== 'reset' && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">{t('orContinueWith')}</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-3 px-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card disabled:opacity-50"
              >
                {googleLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {t('signInWithGoogle')}
              </button>
            </>
          )}

          {/* Toggle mode */}
          <div className="text-center mt-4 text-sm text-slate-500">
            {mode === 'login' ? (
              <span>{t('newHere')} <button onClick={() => setMode('register')} className="text-sky-600 font-medium hover:underline">{t('register')}</button></span>
            ) : mode === 'register' ? (
              <span>{t('alreadyHaveAccount')} <button onClick={() => setMode('login')} className="text-sky-600 font-medium hover:underline">{t('login')}</button></span>
            ) : (
              <button onClick={() => setMode('login')} className="text-sky-600 font-medium hover:underline">← Back to sign in</button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          By continuing, you agree to our terms of service. Your data is kept private and secure.
        </p>
      </div>
    </div>
  )
}
