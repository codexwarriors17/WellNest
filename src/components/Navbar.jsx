// src/components/Navbar.jsx
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { logout } from '../firebase/firebaseFunctions'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'mr', label: 'म' },
  { code: 'ta', label: 'த' },
]

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out. Take care! 🌿')
    navigate('/')
  }

  const navLinks = user
    ? [
        { path: '/dashboard', label: t('dashboard') },
        { path: '/mood', label: t('moodTracker') },
        { path: '/selfhelp', label: t('selfHelp') },
        { path: '/chat', label: t('chatWithUs') },
        { path: '/community', label: '👥 Community' },
      ]
    : [{ path: '/', label: t('home') }]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-3">
        <div className="glass rounded-2xl shadow-soft px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center shadow-soft">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="font-display text-lg text-sky-700">{t('appName')}</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="text-xs font-mono font-medium text-slate-600 hover:text-sky-600 px-2 py-1.5 rounded-lg hover:bg-sky-50 transition-all duration-200"
              >
                {i18n.language.toUpperCase().slice(0, 2)} ▾
              </button>
              {langOpen && (
                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-card border border-slate-100 py-1 min-w-[80px] z-10">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false) }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-sky-50 transition-colors ${
                        i18n.language === lang.code ? 'text-sky-600 font-medium' : 'text-slate-600'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/profile" className="w-7 h-7 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-semibold text-sm hover:bg-sky-200 transition-colors">
                    {(profile?.displayName || user.email)?.[0]?.toUpperCase()}
                  </Link>
                  <span className="text-sm text-slate-600 hidden lg:block">{profile?.displayName?.split(' ')[0]}</span>
                </div>
                <button onClick={handleLogout} className="btn-ghost text-sm py-1.5 px-3 hidden sm:block">
                  {t('logout')}
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-4 text-sm">
                {t('login')}
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen
                  ? <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                  : <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="glass rounded-2xl shadow-card mt-2 py-2 md:hidden animate-slide-up">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive(link.path) ? 'text-sky-600 bg-sky-50' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors">
                {t('logout')}
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
