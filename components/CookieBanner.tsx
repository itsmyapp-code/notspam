'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent notice"
      className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(17,24,39,0.96)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.05)',
      }}
    >
      <div className="px-8 py-4 flex flex-row items-center justify-between gap-8">
        <div className="flex-1 min-w-0">
          <p className="text-[--color-text-primary] text-sm font-semibold mb-1">
            Privacy Notice
          </p>
          <p className="text-[--color-text-secondary] text-xs leading-relaxed">
            This service operates with{' '}
            <strong className="text-[--color-text-primary]">zero tracking or analytics cookies</strong>.
            Only strictly necessary session functions are active under PECR exemption.{' '}
            <Link href="/cookies" className="text-[--color-cyan] hover:underline underline-offset-2">
              Cookie Policy
            </Link>
          </p>
        </div>
        <div className="flex flex-row gap-2 shrink-0">
          <button
            id="cookie-reject-btn"
            onClick={() => setVisible(false)}
            className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text-secondary)',
            }}
            aria-label="Dismiss cookie notice"
          >
            Dismiss
          </button>
          <button
            id="cookie-accept-btn"
            onClick={() => setVisible(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200"
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981',
            }}
            aria-label="Acknowledge cookie notice"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  )
}
