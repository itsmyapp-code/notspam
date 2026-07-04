import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — NOTSPAM.uk',
  description: 'Terms of Service for NOTSPAM.uk temporary email service.',
  robots: { index: false, follow: false },
}

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-[--color-text-muted] text-sm">
          Last Updated: July 2026 · Governing Law: England and Wales
        </p>
      </header>

      <div className="space-y-10 text-sm text-[--color-text-secondary] leading-relaxed">
        <section aria-labelledby="terms-agreement">
          <h2 id="terms-agreement" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using NOTSPAM.uk (the &ldquo;Service&rdquo;), you confirm that you have read,
            understood, and agree to be bound by these Terms of Service. If you do not agree, you must
            immediately cease use of the Service. Access to the Service constitutes your agreement to
            these Terms.
          </p>
        </section>

        <section aria-labelledby="terms-description">
          <h2 id="terms-description" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            2. Service Description
          </h2>
          <p>
            NOTSPAM.uk provides ephemeral, client-side temporary email address generation for the purpose
            of shielding users&apos; primary email addresses from unsolicited communications. All processing
            occurs entirely within your browser. The Service retains zero data and operates no server-side
            storage infrastructure. Email messages are retrieved from a third-party relay provider
            (1secmail.com) and are never stored by NOTSPAM.uk.
          </p>
        </section>

        <section aria-labelledby="terms-session">
          <h2 id="terms-session" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            3. Session Accountability
          </h2>
          <p>
            You are fully and solely accountable for preserving the security of any session tokens,
            temporary addresses, or local parameters generated during your use of the Service. Sharing
            a generated address constitutes sharing access to all messages delivered to that address.
            The Service provides no authentication mechanism and no access control on generated addresses.
          </p>
        </section>

        <section aria-labelledby="terms-acceptable-use">
          <h2 id="terms-acceptable-use" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            4. Acceptable Use
          </h2>
          <p className="mb-3">
            You agree not to use the Service for any purpose that is unlawful under applicable law, or
            in any manner that infringes upon the rights of others. Prohibited uses include but are not
            limited to:
          </p>
          <ul className="list-none space-y-2 pl-4 border-l border-[--color-border-strong]">
            {[
              'Circumventing legal identity verification requirements',
              'Facilitating fraud, phishing, or social engineering attacks',
              'Receiving content that is illegal under UK law',
              'Automated bulk address generation or API scraping',
              'Any activity that places excessive load on the Service or underlying relay providers',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-[--color-danger] shrink-0">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            The Service may suspend or restrict access immediately and without notice where use breaches
            these parameters or causes harm to other users or infrastructure.
          </p>
        </section>

        <section aria-labelledby="terms-disclaimer">
          <h2 id="terms-disclaimer" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            5. Disclaimer of Warranties
          </h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranty of any kind,
            express or implied. We make no guarantees regarding uptime, message delivery reliability,
            or the continued availability of any third-party relay provider. Temporary email addresses
            are by design transient and may cease to receive messages at any time.
          </p>
        </section>

        <section aria-labelledby="terms-limitation">
          <h2 id="terms-limitation" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            6. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, ItsMyApp.co.uk and its operators shall not be liable
            for any indirect, incidental, special, consequential, or punitive damages arising from your
            use of or inability to use the Service. Our aggregate liability shall not exceed £1 (one pound
            sterling).
          </p>
        </section>

        <section aria-labelledby="terms-changes">
          <h2 id="terms-changes" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            7. Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the Service following
            any such modification constitutes your agreement to the revised Terms. The &ldquo;Last Updated&rdquo;
            date at the top of this page will reflect the date of any changes.
          </p>
        </section>

        <section aria-labelledby="terms-governing-law">
          <h2 id="terms-governing-law" className="text-lg font-bold text-[--color-text-primary] mb-3 tracking-wider">
            8. Governing Law
          </h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of England and Wales.
            Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of
            the courts of England and Wales.
          </p>
        </section>

        <div className="border-t border-[--color-border-subtle] pt-8">
          <p className="text-[--color-text-muted] text-xs">
            Questions about these Terms? Contact us at{' '}
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
