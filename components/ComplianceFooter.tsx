import Link from 'next/link'

export default function ComplianceFooter() {
  return (
    <footer
      className="shrink-0"
      style={{ borderTop: '1px solid var(--color-border)', background: 'rgba(17,24,39,0.8)' }}
      aria-label="Site footer"
    >
      {/* Data Privacy Bar */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }} className="px-8 py-3">
        <p className="text-[--color-text-muted] text-xs text-center leading-relaxed">
          <span className="text-[--color-text-secondary] font-medium">Data Privacy & Compliance: </span>
          Contact our Data Privacy Lead at{' '}
          <a
            href="mailto:hello@itsmyapp.co.uk"
            id="footer-privacy-email"
            className="text-[--color-cyan] hover:underline underline-offset-2"
          >
            hello@itsmyapp.co.uk
          </a>
          . All compliance submissions acknowledged within 30 days.
        </p>
      </div>

      {/* Nav + Copyright */}
      <div className="px-8 py-3.5 flex flex-row items-center justify-between gap-6">
        <nav aria-label="Compliance pages" className="flex flex-row gap-5 flex-wrap">
          {[
            { href: '/terms', label: 'Terms' },
            { href: '/privacy', label: 'Privacy' },
            { href: '/cookies', label: 'Cookies' },
            { href: '/accessibility', label: 'Accessibility' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-[--color-text-muted] hover:text-[--color-cyan] text-xs transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-[--color-text-muted] text-xs shrink-0">
          © 2026{' '}
          <a href="https://itsmyapp.co.uk" target="_blank" rel="noopener noreferrer" id="footer-itsmyapp-link"
            className="text-[--color-text-secondary] hover:text-[--color-cyan] transition-colors duration-200">
            ItsMyApp.co.uk
          </a>
          {' '}|{' '}
          <a href="mailto:hello@itsmyapp.co.uk" id="footer-contact-link"
            className="text-[--color-text-secondary] hover:text-[--color-cyan] transition-colors duration-200">
            hello@itsmyapp.co.uk
          </a>
        </p>
      </div>
    </footer>
  )
}
