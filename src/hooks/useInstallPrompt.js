// src/hooks/useInstallPrompt.js
// Captures the browser's PWA install prompt event.
// Works on Android Chrome / Edge. Detects iOS separately for manual guidance.

import { useState, useEffect } from 'react'

/**
 * @returns {object} {
 *   canInstall     - true if Android/desktop install prompt is available
 *   isIOS          - true if running on iOS Safari (manual install needed)
 *   isStandalone   - true if already installed / running as PWA
 *   promptInstall  - function: call to show the native install dialog
 *   dismissPrompt  - function: call to hide our custom install banner
 *   isDismissed    - true if user dismissed the banner this session
 * }
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall,     setCanInstall]     = useState(false)
  const [isDismissed,    setIsDismissed]    = useState(() => {
    // Persist dismissal across page reloads (not sessions — show again next visit)
    return sessionStorage.getItem('wellnest_install_dismissed') === 'true'
  })

  // ── Detect iOS ──────────────────────────────────────────────────────────
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  // On iOS, check Safari specifically (Chrome on iOS uses WKWebView, no SW)
  const isIOSSafari = isIOS && /^((?!crios|fxios|opios|mercury).)*safari/i.test(navigator.userAgent)

  // ── Detect standalone mode ──────────────────────────────────────────────
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||   // iOS specific
    document.referrer.includes('android-app://')

  // ── Capture beforeinstallprompt (Android / Desktop) ────────────────────
  useEffect(() => {
    if (isStandalone) return  // Already installed — don't show prompt

    const handler = (e) => {
      e.preventDefault()           // Prevent auto mini-infobar
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setCanInstall(false)
      setDeferredPrompt(null)
      sessionStorage.setItem('wellnest_install_dismissed', 'true')
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isStandalone])

  const promptInstall = async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setCanInstall(false)
    return outcome === 'accepted'
  }

  const dismissPrompt = () => {
    setIsDismissed(true)
    sessionStorage.setItem('wellnest_install_dismissed', 'true')
  }

  return {
    canInstall: canInstall && !isDismissed,
    isIOS:      isIOSSafari && !isStandalone && !isDismissed,
    isStandalone,
    promptInstall,
    dismissPrompt,
    isDismissed,
  }
}