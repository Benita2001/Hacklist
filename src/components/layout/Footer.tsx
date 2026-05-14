import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { GetAccessButton } from '@/components/ui/GetAccessButton';

const footerLinks = [
  { label: 'About',              href: '/about' },
  { label: 'List My Opportunity', href: '/submit' },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border-default)',
        backgroundColor: 'var(--color-bg-base)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px clamp(24px, 4vw, 48px)',
        }}
      >
        {/* Main row */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          style={{ gap: 'var(--space-6)' }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-olive)',
              }}
            />
            <span
              className="font-serif"
              style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }}
            >
              {siteConfig.name}
            </span>
          </div>

          {/* Nav links */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center"
            style={{ gap: 'var(--space-6)' }}
          >
            {footerLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={[
                  'text-[color:var(--color-text-secondary)]',
                  'hover:text-[color:var(--color-text-primary)]',
                  'transition-colors',
                  'duration-[var(--duration-base)]',
                ].join(' ')}
                style={{ fontSize: 'var(--text-sm)' }}
              >
                {label}
              </Link>
            ))}
            <GetAccessButton variant="inline" />
          </nav>
        </div>

        {/* Copyright */}
        <p
          style={{
            marginTop: 'var(--space-8)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          &copy; {year} {siteConfig.name}. Not affiliated with any hackathon organizer.
        </p>
      </div>
    </footer>
  );
}
