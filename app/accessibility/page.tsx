import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Accessibility Statement — NOTSPAM.uk',
  description: 'Accessibility Statement for NOTSPAM.uk, targeting WCAG 2.1 Level AA.',
  robots: { index: false, follow: false },
}

export default function AccessibilityPage() {
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
          Accessibility Statement
        </h1>
        <p className="text-[--color-text-muted] text-sm">
          Last Updated: July 2026 · Target Standard: WCAG 2.1 Level AA
        </p>
      </header>

      <div className="space-y-10 text-sm text-[--color-text-secondary] leading-relaxed">

        <section aria-labelledby="a11y-commitment">
          <h2 id="a11y-commitment" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            1. Our Commitment
          </h2>
          <p>
            ItsMyApp.co.uk maintains a firm development commitment to achieving full{' '}
            <strong className="text-[--color-text-primary]">
              Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
            </strong>{' '}
            standardisation across all NOTSPAM.uk interfaces. We believe that accessibility is not an
            optional feature — it is a foundational engineering requirement.
          </p>
        </section>

        <section aria-labelledby="a11y-standards">
          <h2 id="a11y-standards" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            2. Technical Standards Implemented
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {[
              {
                title: 'Keyboard Navigation',
                status: 'Implemented',
                desc: 'All interactive elements — buttons, links, message list items, and form controls — are accessible and operable via full keyboard tabbing sequences. Focus order follows logical reading and interaction flow. Focus indicators are visible and meet minimum contrast requirements.',
              },
              {
                title: 'Colour Contrast',
                status: 'WCAG AAA Target',
                desc: 'All foreground text against background combinations are engineered to achieve a minimum 7:1 contrast ratio (WCAG Level AAA). Interactive elements use clearly distinct active, hover, and focus states.',
              },
              {
                title: 'Semantic HTML Structure',
                status: 'Implemented',
                desc: 'Pages use a clean, logical HTML5 semantic hierarchy: a single <h1> per page, proper heading levels, <nav>, <main>, <header>, <footer>, <article>, <section>, and <aside> landmarks. This ensures screen readers can navigate efficiently.',
              },
              {
                title: 'ARIA Labels & Roles',
                status: 'Implemented',
                desc: 'Interactive components carry explicit aria-label attributes, aria-pressed states for toggle buttons, aria-live regions for dynamic content updates, and role attributes where native semantics are insufficient. Email list items announce sender and subject to assistive technologies.',
              },
              {
                title: 'No Motion Barrier',
                status: 'Implemented',
                desc: 'Animations (pulse indicators, loading spinners) are purely decorative and do not convey functional information. State changes are always communicated via text or ARIA, never by animation alone.',
              },
              {
                title: 'Monospace Typography',
                status: 'Implemented',
                desc: 'JetBrains Mono is used throughout for its exceptional letter-spacing, digit alignment, and legibility at all sizes. Font is self-hosted via next/font to eliminate external network dependencies.',
              },
            ].map(({ title, status, desc }) => (
              <div key={title} className="border border-[--color-border-strong] p-5">
                <div className="flex items-center justify-between mb-2 gap-4">
                  <h3 className="text-[--color-text-primary] text-sm font-bold tracking-wider">{title}</h3>
                  <span className="text-[--color-accent-emerald] text-xs font-bold tracking-wider shrink-0">
                    ✓ {status}
                  </span>
                </div>
                <p className="text-xs text-[--color-text-secondary] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="a11y-known-issues">
          <h2 id="a11y-known-issues" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            3. Known Limitations
          </h2>
          <div className="border border-[--color-border-strong] p-5">
            <p className="mb-3">
              <strong className="text-[--color-text-primary]">HTML Email Rendering:</strong>{' '}
              Emails with HTML content are displayed inside a sandboxed{' '}
              <code className="text-[--color-accent-cyan] text-xs px-1 py-0.5 bg-[--color-bg-elevated]">
                &lt;iframe&gt;
              </code>{' '}
              element. The accessibility of the email content itself (heading structure, contrast, alt
              text) is determined by the email sender, not by NOTSPAM.uk. We are unable to control or
              remediate accessibility issues within third-party email content.
            </p>
            <p>
              <strong className="text-[--color-text-primary]">Minimum Viewport:</strong>{' '}
              The application is designed for landscape desktop viewports at a minimum width of 1280px.
              The layout has not been optimised for mobile or narrow viewports. This is a deliberate
              product constraint, not an oversight.
            </p>
          </div>
        </section>

        <section aria-labelledby="a11y-testing">
          <h2 id="a11y-testing" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            4. Testing Approach
          </h2>
          <p>
            We test accessibility using a combination of automated tooling (axe-core) and manual testing
            with keyboard-only navigation. We periodically test with NVDA (Windows) and VoiceOver (macOS)
            screen readers to validate ARIA implementation.
          </p>
        </section>

        <section aria-labelledby="a11y-feedback">
          <h2 id="a11y-feedback" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            5. Feedback & Contact
          </h2>
          <p>
            If you experience any accessibility barrier while using NOTSPAM.uk, please contact us at{' '}
            <a
              href="mailto:hello@itsmyapp.co.uk"
              className="text-[--color-accent-cyan] hover:underline underline-offset-2"
              aria-label="Email our accessibility team"
            >
              hello@itsmyapp.co.uk
            </a>
            . We aim to respond to all accessibility feedback within 5 working days and to resolve
            confirmed barriers within 30 calendar days.
          </p>
        </section>
      </div>
    </article>
  )
}
