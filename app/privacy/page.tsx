import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — NOTSPAM.uk',
  description: 'UK GDPR-compliant Privacy Policy for NOTSPAM.uk.',
  robots: { index: false, follow: false },
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-[--color-text-muted] text-sm">
          Last Updated: July 2026 · UK GDPR Compliant · ICO Registered
        </p>
      </header>

      <div className="space-y-10 text-sm text-[--color-text-secondary] leading-relaxed">

        <section aria-labelledby="privacy-intro">
          <h2 id="privacy-intro" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            1. Who We Are
          </h2>
          <p>
            NOTSPAM.uk is operated by ItsMyApp.co.uk. For all data protection enquiries, please contact
            our Data Privacy Lead at{' '}
            <a href="mailto:hello@itsmyapp.co.uk" className="text-[--color-accent-cyan] hover:underline underline-offset-2">
              hello@itsmyapp.co.uk
            </a>
            .
          </p>
        </section>

        <section aria-labelledby="privacy-zero-data">
          <h2 id="privacy-zero-data" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            2. Our Zero-Data Architecture
          </h2>
          <p className="mb-3">
            NOTSPAM.uk is a client-side-only application. By design:
          </p>
          <ul className="list-none space-y-2 pl-4 border-l border-[--color-accent-emerald]/30">
            {[
              'We store zero personal data on any server operated by or on behalf of NOTSPAM.uk',
              'All email address generation occurs in your browser using a cryptographically secure random number generator',
              'Email message content is fetched directly from a third-party relay (1secmail.com) and rendered only within your browser session',
              'A browser refresh permanently and irrecoverably destroys your session',
              'We set no persistent cookies and use no client-side storage (localStorage, IndexedDB, etc.)',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-[--color-accent-emerald] shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="privacy-data-categories">
          <h2 id="privacy-data-categories" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            3. Information Points We May Process
          </h2>
          <p className="mb-4">
            In the course of operating our infrastructure and protecting against abuse, we may
            transiently process the following categories of information:
          </p>

          <div className="space-y-4">
            {[
              {
                title: 'Technical & Network Data',
                items: [
                  'IP address (processed by our hosting infrastructure for fraud detection and abuse prevention)',
                  'Browser user-agent string (for compatibility and bot detection)',
                  'Request timestamps and HTTP status codes (for fault diagnosis)',
                  'TLS handshake metadata (for connection security)',
                ],
              },
              {
                title: 'System Usage Metrics',
                items: [
                  'Aggregate request volumes (no individual identification)',
                  'Error rates and response times (for service stability)',
                ],
              },
            ].map(({ title, items }) => (
              <div key={title} className="border border-[--color-border-strong] p-4">
                <h3 className="text-[--color-text-primary] text-sm font-bold mb-2 tracking-wider">
                  {title}
                </h3>
                <ul className="list-none space-y-1.5">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3 text-xs">
                      <span className="text-[--color-text-muted] shrink-0">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="privacy-legal-bases">
          <h2 id="privacy-legal-bases" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            4. Legal Bases for Processing
          </h2>
          <p className="mb-3">
            Where any transient processing occurs, we rely on the following legal bases under UK GDPR:
          </p>
          <div className="space-y-3">
            <div className="flex gap-4 p-3 border border-[--color-border-subtle]">
              <span className="text-[--color-accent-emerald] text-xs font-bold tracking-wider shrink-0 mt-0.5">
                ART. 6(1)(f)
              </span>
              <div>
                <p className="text-[--color-text-primary] text-xs font-bold mb-1">Legitimate Interests</p>
                <p className="text-xs">
                  Infrastructure stabilisation, malware and fraud detection, connection parameter
                  verification to minimise structural abuse, and critical fault diagnosis and repair.
                  These processing operations are managed under recognised Legitimate Interests grounds.
                  A Legitimate Interests Assessment (LIA) has been conducted and is available on request.
                  No balancing assessment override applies given the minimal privacy impact and the
                  absence of any sensitive data categories.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="privacy-third-parties">
          <h2 id="privacy-third-parties" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            5. Third-Party Services
          </h2>
          <p>
            NOTSPAM.uk uses <strong className="text-[--color-text-primary]">1secmail.com</strong> as a
            third-party email relay provider. When you use the Service, your browser makes direct API
            requests to 1secmail.com to retrieve messages. 1secmail.com&apos;s own privacy policy and data
            retention terms apply to any data transmitted to their servers. We have no control over
            1secmail.com&apos;s data practices and encourage you to review their documentation.
          </p>
          <p className="mt-3">
            Our hosting infrastructure is provided by <strong className="text-[--color-text-primary]">Vercel, Inc.</strong>,
            which may process technical connection data as described in section 3. Vercel&apos;s data
            processing agreements are compliant with UK GDPR requirements.
          </p>
        </section>

        <section aria-labelledby="privacy-rights">
          <h2 id="privacy-rights" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            6. Your UK GDPR Rights
          </h2>
          <p className="mb-3">
            Under the UK General Data Protection Regulation, you have the following rights:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { right: 'Right of Access (SAR)', desc: 'Request a copy of any personal data we hold' },
              { right: 'Right to Rectification', desc: 'Correct inaccurate data we hold about you' },
              { right: 'Right to Erasure', desc: 'Request deletion of your personal data' },
              { right: 'Right to Restrict', desc: 'Limit how we use your data' },
              { right: 'Right to Object', desc: 'Object to processing based on legitimate interests' },
              { right: 'Right to Portability', desc: 'Receive your data in a machine-readable format' },
            ].map(({ right, desc }) => (
              <div key={right} className="border border-[--color-border-subtle] p-3">
                <p className="text-[--color-text-primary] text-xs font-bold mb-1">{right}</p>
                <p className="text-[--color-text-muted] text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="privacy-sar">
          <h2 id="privacy-sar" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            7. Subject Access Requests (SARs)
          </h2>
          <p>
            To exercise any of your rights, submit a written request to{' '}
            <a href="mailto:hello@itsmyapp.co.uk" className="text-[--color-accent-cyan] hover:underline underline-offset-2">
              hello@itsmyapp.co.uk
            </a>
            . We will formally acknowledge your request within 30 days. This 30-day period may be
            paused where we require additional information to verify your identity or to clarify
            the scope of your request.
          </p>
        </section>

        <section aria-labelledby="privacy-ico">
          <h2 id="privacy-ico" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            8. Right to Escalate to the ICO
          </h2>
          <p>
            If you are unsatisfied with our response to a data protection concern, you have the right
            to lodge a complaint with the Information Commissioner&apos;s Office (ICO), the UK&apos;s supervisory
            authority for data protection matters:
          </p>
          <div className="mt-3 border border-[--color-border-strong] p-4 text-xs space-y-1">
            <p><span className="text-[--color-text-muted]">Website: </span>
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-[--color-accent-cyan] hover:underline underline-offset-2">ico.org.uk</a>
            </p>
            <p><span className="text-[--color-text-muted]">Phone: </span>
              <span className="text-[--color-text-secondary]">0303 123 1113</span>
            </p>
            <p><span className="text-[--color-text-muted]">Address: </span>
              <span className="text-[--color-text-secondary]">Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</span>
            </p>
          </div>
        </section>
      </div>
    </article>
  )
}
