// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  loginAnonymously,
  resetPassword,
} from '../firebase/firebaseFunctions'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode]               = useState('login')   // 'login' | 'register' | 'reset'
  const [loading, setLoading]         = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [anonLoading, setAnonLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  // ── Handlers ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await loginWithEmail(form.email, form.password)
        toast.success('Welcome back! 🌿')
        navigate('/dashboard')
      } else if (mode === 'register') {
        if (form.name.trim().length < 2) {
          toast.error('Please enter your name'); setLoading(false); return
        }
        await registerWithEmail(form.email, form.password, form.name)
        toast.success('Welcome to WellNest! 🌸')
        navigate('/dashboard')
      } else {
        await resetPassword(form.email)
        toast.success('Reset link sent! Check your inbox.')
        setMode('login')
      }
    } catch (err) {
      const msg =
        err.code === 'auth/invalid-credential'    ? 'Invalid email or password' :
        err.code === 'auth/email-already-in-use'  ? 'Email already registered. Sign in instead.' :
        err.code === 'auth/weak-password'         ? 'Password must be at least 6 characters' :
        err.code === 'auth/user-not-found'        ? 'No account found with this email' :
        err.code === 'auth/wrong-password'        ? 'Incorrect password' :
        'Something went wrong. Please try again.'
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
      toast.error(err.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled.' : 'Google sign-in failed. Try again.')
    }
    setGoogleLoading(false)
  }

  const handleAnonymous = async () => {
    setAnonLoading(true)
    try {
      await loginAnonymously()
      toast.success("You're in as a Guest 👋 Your data is saved locally.")
      navigate('/dashboard')
    } catch {
      toast.error('Could not sign in anonymously. Try again.')
    }
    setAnonLoading(false)
  }

  // ── UI helpers ────────────────────────────────────────
  const titles = {
    login:    { heading: 'Welcome back',    sub: 'Your wellness journey continues here' },
    register: { heading: 'Join WellNest',   sub: 'Free mental health support, always here' },
    reset:    { heading: 'Reset password',  sub: "We'll send a reset link to your email" },
  }

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-10">
      {/* Decorative orbs */}
      <div className="orb orb-sky    w-72 h-72 top-10   -left-20"  />
      <div className="orb orb-violet w-64 h-64 bottom-10 -right-16" />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          ← Back to home
        </Link>

        {/* Logo + title */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center
                            shadow-[0_4px_16px_rgba(14,165,233,0.4)] group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="font-display text-2xl text-slate-800">WellNest</span>
          </Link>
          <h1 className="font-display text-3xl text-slate-900">{titles[mode].heading}</h1>
          <p className="text-slate-500 text-sm mt-1.5">{titles[mode].sub}</p>
        </div>

        {/* ── Main card ── */}
        <div className="card shadow-xl border-slate-100 space-y-4">

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="animate-slide-in">
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Your Name</label>
                <input type="text" value={form.name} onChange={update('name')} required
                  placeholder="How should we call you?" className="input" autoFocus />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={form.email} onChange={update('email')} required
                placeholder="you@example.com" className="input" autoComplete="email" />
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('reset')}
                      className="text-xs text-sky-500 hover:text-sky-700 font-medium">Forgot?</button>
                  )}
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={update('password')} required
                    placeholder="••••••••" className="input pr-10"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {mode === 'register' && <p className="text-xs text-slate-400 mt-1">At least 6 characters</p>}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-gradient w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold">
              {loading ? <><Spinner /> Please wait…</> :
               mode === 'login' ? 'Sign In' :
               mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          {/* Divider + social */}
          {mode !== 'reset' && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Google */}
              <button onClick={handleGoogle} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50
                           border border-slate-200 text-slate-700 font-semibold py-3 rounded-2xl
                           transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 text-sm">
                {googleLoading ? <Spinner /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>

              {/* ── Anonymous ── */}
              <button onClick={handleAnonymous} disabled={anonLoading}
                className="w-full flex items-center justify-center gap-2.5 bg-slate-50 hover:bg-slate-100
                           border border-dashed border-slate-300 hover:border-slate-400
                           text-slate-600 font-semibold py-3 rounded-2xl
                           transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm">
                {anonLoading ? <Spinner /> : <span className="text-xl leading-none">👤</span>}
                {anonLoading ? 'Entering…' : 'Continue as Guest (No signup)'}
              </button>

              {/* Guest notice */}
              <p className="text-xs text-center text-slate-400 leading-relaxed px-2">
                Guest sessions are saved to your device. You can <span className="text-sky-500 font-medium">upgrade to a full account</span> anytime from your profile to keep your data permanently.
              </p>
            </>
          )}

          {/* Toggle login / register */}
          <p className="text-center text-sm text-slate-500 pt-1">
            {mode === 'login' ? (
              <>New here?{' '}
                <button onClick={() => setMode('register')} className="text-sky-600 font-semibold hover:underline">Create account</button>
              </>
            ) : mode === 'register' ? (
              <>Have an account?{' '}
                <button onClick={() => setMode('login')} className="text-sky-600 font-semibold hover:underline">Sign in</button>
              </>
            ) : (
              <button onClick={() => setMode('login')} className="text-sky-600 font-semibold hover:underline">← Back to sign in</button>
            )}
          </p>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-5 mt-5 text-xs text-slate-400">
          <span>🔒 Secure</span>
          <span>🚫 No ads</span>
          <span>💙 Free forever</span>
        </div>
      </div>
    </div>
  )
}
