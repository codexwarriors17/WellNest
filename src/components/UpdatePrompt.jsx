// src/components/UpdatePrompt.jsx
// Shown when VitePWA detects a new service worker is waiting.
// User can choose to update immediately or dismiss.

import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.info('[PWA] SW registered:', r)
    },
    onRegisterError(error) {
      console.warn('[PWA] SW registration error:', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96
                 bg-white rounded-2xl shadow-2xl border border-emerald-100
                 flex items-center gap-3 p-4 animate-slide-up"
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xl">✨</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">Update Available</p>
        <p className="text-xs text-slate-500 mt-0.5">A new version of WellNest is ready</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold
                     px-4 py-2 rounded-xl transition-colors"
        >
          Update
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          aria-label="Dismiss update"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
