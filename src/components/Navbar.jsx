// src/components/Navbar.jsx
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { code: 'en', label: 'EN', native: 'English' },
  { code: 'hi', label: 'हि', native: 'हिंदी' },
  { code: 'mr', label: 'म',  native: 'मराठी'  },
  { code: 'ta', label: 'த',  native: 'தமிழ்'  },
]

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard',  icon: '⊞' },
  { path: '/mood',      label: 'Mood',        icon: '◑' },
  { path: '/selfhelp',  label: 'Self-Help',   icon: '◎' },
  { path: '/chat',      label: 'Chat',        icon: '◉' },
  { path: '/community', label: 'Community',   icon: '◈' },
]

export default function Navbar() {
  const { t, i18n }                          = useTranslation()
  const { user, profile, isAnonymous, logout } = useAuth() // ✅ use AuthContext logout (handles FCM cleanup)
  const location                             = useLocation()
  const navigate                             = useNavigate()
  const [menuOpen, setMenuOpen]              = useState(false)
  const [langOpen, setLangOpen]              = useState(false)
  const [scrolled, setScrolled]              = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()  // ✅ deletes FCM token, then signs out
    toast.success('Signed out. Take care! 🌿')
    navigate('/')
  }

  const isActive = (path) => location.pathname === path
  const initials = (profile?.displayName || user?.email || 'U')[0].toUpperCase()

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className={`card-glass px-5 py-3 flex items-center justify-between transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-[0_2px_8px_rgba(14,165,233,0.4)] group-hover:scale-105 transition-transform">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="font-display text-[17px] text-slate-800 tracking-tight">WellNest</span>
          </Link>

          {/* Desktop nav */}
          {user && (
            <div className="hidden md:flex items-center gap-0.5">
              {NAV_ITEMS.map(item => (
                <Link key={item.path} to={item.path}
                  className={`px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-sky-500 text-white shadow-[0_2px_8px_rgba(14,165,233,0.35)]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language */}
            <div className="relative">
              <button onClick={() => { setLangOpen(!langOpen); setMenuOpen(false) }}
                className="text-[11px] font-mono font-semibold text-slate-500 hover:text-sky-600 px-2.5 py-1.5 rounded-lg hover:bg-sky-50 transition-all">
                {i18n.language.slice(0, 2).toUpperCase()} ▾
              </button>
              {langOpen && (
                <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 w-36 z-50 animate-pop-in">
                  {LANGUAGES.map(lang => (
                    <button key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-sky-50 transition-colors ${i18n.language === lang.code ? 'text-sky-600 font-semibold' : 'text-slate-600'}`}>
                      <span className="font-mono text-xs w-5">{lang.label}</span>
                      <span>{lang.native}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile"
                  title={isAnonymous ? 'Guest — tap to upgrade' : 'Profile'}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:scale-105 ${
                    profile?.avatarColor
                      ? `bg-gradient-to-br ${profile.avatarColor} text-white shadow-sm`
                      : 'bg-sky-100 text-sky-700'
                  }`}>
                  {initials}
                </Link>
                {isAnonymous ? (
                  <Link to="/profile"
                    className="hidden sm:flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-all">
                    ⭐ Upgrade
                  </Link>
                ) : (
                  <button onClick={handleLogout}
                    className="hidden sm:block text-xs text-slate-500 hover:text-rose-500 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-all font-medium">
                    Sign out
                  </button>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-5 text-sm">
                Get Started
              </Link>
            )}

            {/* Hamburger */}
            <button onClick={() => { setMenuOpen(!menuOpen); setLangOpen(false) }}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all">
              <div className={`w-5 h-3.5 flex flex-col justify-between transition-all ${menuOpen ? 'gap-0' : 'gap-1.5'}`}>
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="card-glass mt-2 py-3 md:hidden animate-fade-up">
            {user ? (
              <>
                {NAV_ITEMS.map((item, i) => (
                  <Link key={item.path} to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors animate-slide-in delay-${i * 100} ${
                      isActive(item.path) ? 'text-sky-600 bg-sky-50' : 'text-slate-700 hover:bg-slate-50'
                    }`}>
                    <span className="text-base">{item.icon}</span>{item.label}
                  </Link>
                ))}
                <div className="mx-4 my-2 h-px bg-slate-100" />
                <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <span>👤</span> Profile & Badges
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50">
                  <span>→</span> Sign Out
                </button>
              </>
            ) : (
              <div className="px-4 py-2">
                <Link to="/login" className="btn-primary w-full justify-center">Get Started</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
