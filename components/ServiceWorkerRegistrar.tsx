'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          // SW registration failure is non-critical — app works without it
          console.warn('[NOTSPAM] Service worker registration failed:', err)
        })
    }
  }, [])

  return null
}
