import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy — NOTSPAM.uk',
  description: 'Cookie Policy for NOTSPAM.uk — a zero-cookie, zero-tracking service.',
  robots: { index: false, follow: false },
}

export default function CookiesPage() {
  return (
    <article className="max-w-4xl mx-auto px-8 py-16 font-mono">
      <nav className="mb-8" aria-label="Breadcrumb">
        <Link
          href="/"
          className="text-[--color-accent-cyan] text-xs tracking-widest hover:underline underline-offset-2"
        >
          ← BACK TO CLEAN ROOM
        </Link>
      </nav>

      <header className="mb-12">
        <p className="text-[--color-accent-emerald] text-xs tracking-widest font-bold mb-3">
          NOTSPAM.UK · LEGAL
        </p>
        <h1 className="text-4xl font-black text-[--color-text-primary] tracking-tight mb-3">
          Cookie Policy
        </h1>
        <p className="text-[--color-text-muted] text-sm">
          Last Updated: July 2026 · UK PECR &amp; UK GDPR Compliant
        </p>
      </header>

      <div className="space-y-10 text-sm text-[--color-text-secondary] leading-relaxed">

        <section aria-labelledby="cookies-overview">
          <h2 id="cookies-overview" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            1. Our Cookie Position
          </h2>
          <div className="flex items-start gap-4 border border-[--color-accent-emerald]/30 bg-[--color-accent-emerald]/5 p-5">
            <span className="text-[--color-accent-emerald] text-2xl shrink-0" aria-hidden="true">✓</span>
            <div>
              <p className="text-[--color-text-primary] font-bold mb-2">NOTSPAM.uk sets zero cookies.</p>
              <p>
                This service does not place any cookies on your device — not even session cookies,
                preference cookies, or analytics cookies. All application state is held exclusively
                in browser memory (React state) and is destroyed upon page close or refresh.
                This is the highest possible privacy posture for a web service.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="cookies-classification">
          <h2 id="cookies-classification" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            2. Cookie Classification Table
          </h2>
          <p className="mb-4">
            Under the Privacy and Electronic Communications Regulations (PECR) and UK GDPR, cookies
            are classified into functional tiers. Below is our full disclosure:
          </p>

          <div className="space-y-4">
            {/* Necessary */}
            <div className="border border-[--color-border-strong]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[--color-border-subtle] bg-[--color-bg-elevated]">
                <span className="text-[--color-text-primary] text-xs font-bold tracking-widest">
                  NECESSARY COOKIES
                </span>
                <span className="text-[--color-accent-emerald] text-xs font-bold">NOT SET</span>
              </div>
              <div className="px-5 py-4 text-xs space-y-2">
                <p>
                  Strictly necessary cookies are identifiers required for secure session validation
                  and core service functionality. These cannot be switched off in compliant systems.
                </p>
                <p className="text-[--color-text-muted]">
                  <strong className="text-[--color-text-secondary]">NOTSPAM.uk status:</strong>{' '}
                  Not required. Our zero-state architecture eliminates the need for any session
                  identifiers. No login, no cart, no persistent session.
                </p>
              </div>
            </div>

            {/* Performance */}
            <div className="border border-[--color-border-strong]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[--color-border-subtle] bg-[--color-bg-elevated]">
                <span className="text-[--color-text-primary] text-xs font-bold tracking-widest">
                  PERFORMANCE & ANALYTICS COOKIES
                </span>
                <span className="text-[--color-accent-emerald] text-xs font-bold">NOT SET</span>
              </div>
              <div className="px-5 py-4 text-xs space-y-2">
                <p>
                  Performance cookies handle optimisation metrics under DUAA (Data Use and Access Act)
                  allowances for first-party anonymous performance analytics. When used, a clear
                  opt-out mechanism must be available.
                </p>
                <p className="text-[--color-text-muted]">
                  <strong className="text-[--color-text-secondary]">NOTSPAM.uk status:</strong>{' '}
                  We operate no analytics collection. No performance tracking scripts are loaded.
                </p>
              </div>
            </div>

            {/* Marketing */}
            <div className="border border-[--color-border-strong]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[--color-border-subtle] bg-[--color-bg-elevated]">
                <span className="text-[--color-text-primary] text-xs font-bold tracking-widest">
                  MARKETING & TRACKING COOKIES
                </span>
                <span className="text-[--color-danger] text-xs font-bold">BLOCKED — ALWAYS</span>
              </div>
              <div className="px-5 py-4 text-xs space-y-2">
                <p>
                  Third-party marketing trackers, conversion pixels, and retargeting scripts require
                  explicit, unambiguous opt-in consent before they may be executed. They may not be
                  pre-loaded or soft-loaded pending consent.
                </p>
                <p className="text-[--color-text-muted]">
                  <strong className="text-[--color-text-secondary]">NOTSPAM.uk status:</strong>{' '}
                  Strictly and permanently blocked. We have no advertising relationships and no
                  commercial interest in tracking user behaviour. No tracking module of any kind
                  is loaded by this service.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="cookies-third-party">
          <h2 id="cookies-third-party" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            3. Third-Party API Requests
          </h2>
          <p>
            When you use the Service, your browser makes direct API calls to{' '}
            <strong className="text-[--color-text-primary]">1secmail.com</strong> to retrieve email
            messages. These requests originate from your browser, not from any NOTSPAM.uk server.
            1secmail.com may set their own cookies or log your request. Please review their privacy
            documentation. We have no control over their cookie behaviour.
          </p>
        </section>

        <section aria-labelledby="cookies-browser">
          <h2 id="cookies-browser" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            4. Managing Cookies in Your Browser
          </h2>
          <p className="mb-3">
            Although NOTSPAM.uk itself sets no cookies, you can manage all cookies in your browser
            settings. Links to major browser cookie managers:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { browser: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
              { browser: 'Mozilla Firefox', url: 'https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer' },
              { browser: 'Apple Safari', url: 'https://support.apple.com/en-gb/guide/safari/sfri11471/mac' },
              { browser: 'Microsoft Edge', url: 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
            ].map(({ browser, url }) => (
              <a
                key={browser}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[--color-border-strong] px-4 py-3 text-xs text-[--color-accent-cyan] hover:border-[--color-accent-cyan] hover:bg-[--color-bg-elevated] transition-all duration-200"
              >
                {browser} →
              </a>
            ))}
          </div>
        </section>

        <div className="border-t border-[--color-border-subtle] pt-8">
          <p className="text-[--color-text-muted] text-xs">
            Questions about our cookie practices? Contact{' '}
            <a
              href="mailto:hello@itsmyapp.co.uk"
              className="text-[--color-accent-cyan] hover:underline underline-offset-2"
            >
              hello@itsmyapp.co.uk
            </a>
          </p>
        </div>
      </div>
    </article>
  )
}
