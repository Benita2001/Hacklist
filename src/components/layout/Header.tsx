'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/app/providers';
import { siteConfig } from '@/config/site';
import { GetAccessButton } from '@/components/ui/GetAccessButton';

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="1.5"  x2="10" y2="4"    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="16"   x2="10" y2="18.5"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1.5" y1="10"  x2="4"   y2="10"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16"  y1="10"  x2="18.5" y2="10"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.9"  y1="3.9"  x2="5.7"  y2="5.7"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14.3" y1="14.3" x2="16.1" y2="16.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.9"  y1="16.1" x2="5.7"  y2="14.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14.3" y1="5.7"  x2="16.1" y2="3.9"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16.5 12.5A7 7 0 0 1 7.5 3.5a7.002 7.002 0 0 0 9 9z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--color-bg-base)',
        borderBottom: '1px solid var(--color-border-default)',
      }}
    >
      <div
        className="h-full flex items-center justify-between"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          gap: 'var(--space-4)',
        }}
      >

        {/* Wordmark */}
        <Link href="/" className="flex items-center shrink-0" style={{ gap: '8px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hacklist-logo.png" alt="HackList" style={{ height: '28px', width: 'auto' }} />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-xl)',
              fontWeight: 400,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.5px',
            }}
          >
            {siteConfig.name}
          </span>
        </Link>

        {/* Right side — scrollable on mobile so all links stay visible */}
        <div
          className="header-nav-right flex items-center"
          style={{ gap: '2px', overflowX: 'auto', flex: '1', minWidth: 0, justifyContent: 'flex-end', paddingLeft: '8px' }}
        >

          {/* About link */}
          <Link
            href="/about"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: pathname === '/about'
                ? 'var(--color-text-primary)'
                : 'var(--color-text-secondary)',
              padding: '6px 10px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'color var(--duration-base) var(--ease-default)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = pathname === '/about' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)')}
          >
            About
          </Link>

          {/* Telegram link */}
          <a
            href="https://t.me/hacklistwithbeni"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              padding: '6px 10px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'color var(--duration-base) var(--ease-default)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            Telegram
          </a>

          {/* List My Opportunity — ghost outlined pill */}
          <Link
            href="/submit"
            className="inline-flex items-center"
            style={{
              height: '32px',
              padding: '0 var(--space-3)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-border-default)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'border-color var(--duration-base), color var(--duration-base)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'var(--color-border-strong)';
              el.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'var(--color-border-default)';
              el.style.color = 'var(--color-text-secondary)';
            }}
          >
            List My Opportunity
          </Link>

          {/* Get Free Access */}
          <span style={{ flexShrink: 0 }}>
            <GetAccessButton variant="pill" />
          </span>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-muted)',
              transition: 'color var(--duration-base)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)')}
          >
            {mounted ? (isDark ? <SunIcon /> : <MoonIcon />) : <span style={{ width: 16, height: 16 }} />}
          </button>
        </div>
      </div>
    </header>
  );
}
