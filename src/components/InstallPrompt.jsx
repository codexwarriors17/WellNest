// src/components/InstallPrompt.jsx
// Shows an install banner for Android (uses native prompt)
// and a step-by-step guide for iOS (Safari share → Add to Home Screen).

import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallPrompt() {
  const { canInstall, isIOS, isStandalone, promptInstall, dismissPrompt } = useInstallPrompt()
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [installing,   setInstalling]   = useState(false)

  // Already installed or no prompt available
  if (isStandalone || (!canInstall && !isIOS)) return null

  // ── Android / Desktop: native install banner ───────────────────────────
  if (canInstall) {
    return (
      <div
        role="banner"
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96
                   bg-white rounded-2xl shadow-2xl border border-sky-100
                   flex items-center gap-3 p-4 animate-slide-up"
      >
        {/* App icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600
                        flex items-center justify-center flex-shrink-0 shadow-md">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm leading-tight">Install WellNest</p>
          <p className="text-xs text-slate-500 mt-0.5">Works offline · No app store needed</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={async () => {
              setInstalling(true)
              await promptInstall()
              setInstalling(false)
            }}
            disabled={installing}
            className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold
                       px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {installing ? '...' : 'Install'}
          </button>
          <button
            onClick={dismissPrompt}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // ── iOS: manual "Add to Home Screen" guide ─────────────────────────────
  if (isIOS) {
    return (
      <>
        {/* Compact banner */}
        {!showIOSGuide && (
          <div className="fixed bottom-4 left-4 right-4 z-50
                          bg-white rounded-2xl shadow-2xl border border-sky-100
                          flex items-center gap-3 p-4 animate-slide-up">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600
                            flex items-center justify-center flex-shrink-0 shadow-md">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">Add to Home Screen</p>
              <p className="text-xs text-slate-500 mt-0.5">Install for offline access</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowIOSGuide(true)}
                className="bg-sky-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                How?
              </button>
              <button
                onClick={dismissPrompt}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                aria-label="Dismiss"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* iOS step-by-step modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
               style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-slide-up shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-800 text-lg">Add to Home Screen</h2>
                <button
                  onClick={() => { setShowIOSGuide(false); dismissPrompt() }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    icon: '⬆️',
                    title: 'Tap the Share button',
                    desc: 'Find the Share icon (box with arrow) at the bottom of Safari',
                  },
                  {
                    step: '2',
                    icon: '➕',
                    title: 'Tap "Add to Home Screen"',
                    desc: 'Scroll down in the share sheet and tap this option',
                  },
                  {
                    step: '3',
                    icon: '✅',
                    title: 'Tap "Add"',
                    desc: 'WellNest will appear on your home screen like a native app',
                  },
                ].map(({ step, icon, title, desc }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 font-bold
                                    text-sm flex items-center justify-center flex-shrink-0">
                      {step}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {icon} {title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* iOS share icon visual hint */}
              <div className="mt-5 p-3 bg-sky-50 border border-sky-100 rounded-2xl flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                </svg>
                <p className="text-xs text-sky-700 font-medium">
                  Look for this icon at the bottom of your screen
                </p>
              </div>

              <button
                onClick={() => { setShowIOSGuide(false); dismissPrompt() }}
                className="mt-4 w-full bg-sky-500 text-white font-semibold py-3 rounded-2xl text-sm"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return null
}
