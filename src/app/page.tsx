'use client';

import { useState } from 'react';
import { getAllHackathons, filterHackathons } from '@/lib/data';
import { FilterState } from '@/lib/types';
import { PageShell } from '@/components/layout/PageShell';
import { FilterBar } from '@/components/hackathon/FilterBar';
import { HackathonGrid } from '@/components/hackathon/HackathonGrid';

const allHackathons = getAllHackathons();

const initialFilters: FilterState = {
  activeFilters: [],
  sortBy:        'deadline',
  searchQuery:   '',
};

export default function HomePage() {
  const [filters, setFilters]     = useState<FilterState>(initialFilters);
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const filtered  = filterHackathons(allHackathons, filters);
  const spotlight = filtered.find(h => h.isSpotlight);
  const regular   = filtered.filter(h => !h.isSpotlight);

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <>
    <PageShell>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: 'var(--space-16)',
          paddingBottom: 'var(--space-12)',
        }}
      >
        {/* Live badge */}
        <div
          className="inline-flex items-center"
          style={{
            gap: 'var(--space-2)',
            padding: '5px var(--space-3)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--color-border-default)',
            backgroundColor: 'var(--color-bg-surface)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <span
            className="dot-pulse shrink-0"
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success)',
            }}
          />
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              letterSpacing: 'var(--tracking-caps)',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            Updated daily · {allHackathons.length} active hackathons
          </span>
        </div>

        {/* Headline — Instrument Serif */}
        <h1
          className="font-serif"
          style={{
            fontSize: 'clamp(38px, 6vw, 60px)',
            fontWeight: 400,
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-4)',
            maxWidth: '640px',
          }}
        >
          Find hackathons{' '}
          <em style={{ color: 'var(--color-moss)', fontStyle: 'italic' }}>
            worth building
          </em>{' '}
          for.
        </h1>

        {/* Prize Hero */}
        <div
          style={{
            marginBottom: 'var(--space-8)',
            paddingTop: 'var(--space-3)',
          }}
        >
          <span
            className="font-serif"
            style={{
              fontSize: 'clamp(72px, 10vw, 104px)',
              fontWeight: 400,
              color: 'var(--color-moss)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              display: 'block',
              marginBottom: 'var(--space-2)',
            }}
          >
            $10,105,000+
          </span>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            in active prizes across {allHackathons.length} hackathons
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            maxWidth: '460px',
            marginBottom: 'var(--space-8)',
          }}
        >
          The fastest way to find AI&nbsp;&amp;&nbsp;Web3 hackathons worth your time.
        </p>

        {/* Email capture */}
        <div style={{ maxWidth: '520px', margin: '0 auto', marginBottom: 'var(--space-10)' }}>
          {submitted ? (
            <p
              style={{
                textAlign: 'center',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--color-moss)',
                padding: 'var(--space-4) 0',
              }}
            >
              ✓ You&apos;re in. Hackathons every Monday — straight to your inbox.
            </p>
          ) : (
            <>
              <form
                onSubmit={handleEmailSubmit}
                style={{
                  display: 'flex',
                  border: `1.5px solid ${emailFocused ? 'var(--color-moss)' : 'var(--color-border-default)'}`,
                  borderRadius: 'var(--radius-pill)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--color-bg-surface)',
                  transition: `border-color var(--duration-base)`,
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="Enter your email to get free access"
                  required
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    padding: '0 var(--space-5)',
                    height: '48px',
                    backgroundColor: 'transparent',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    flexShrink: 0,
                    height: '48px',
                    padding: '0 var(--space-5)',
                    backgroundColor: 'var(--color-moss)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 500,
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: `background-color var(--duration-base)`,
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss-light)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss)')}
                >
                  Get Free Access →
                </button>
              </form>
              <p
                style={{
                  textAlign: 'center',
                  marginTop: 'var(--space-3)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Free forever. No spam. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>

        {/* Search + Filters */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          totalCount={allHackathons.length}
          filteredCount={filtered.length}
        />
      </section>

      {/* ── Divider ──────────────────────────────────────────── */}
      <hr className="divider" />

      {/* ── Grid ─────────────────────────────────────────────── */}
      <div
        style={{
          paddingTop: 'var(--space-8)',
          paddingBottom: 'var(--space-20)',
        }}
      >
        <HackathonGrid
          hackathons={regular}
          spotlight={spotlight}
          noActiveHackathons={allHackathons.length === 0}
        />
      </div>

    </PageShell>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: 'var(--color-moss)',
          paddingTop: 'var(--space-20)',
          paddingBottom: 'var(--space-20)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            padding: '0 var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-5)',
          }}
        >
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 400,
              color: '#FFFFFF',
              lineHeight: 'var(--leading-tight)',
              letterSpacing: '-0.02em',
            }}
          >
            Know a hackathon we&apos;re missing?
          </h2>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'rgba(240, 238, 224, 0.70)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Help the builder community. Listings are free and go live within 48 hours.
          </p>
          <a
            href="/submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 var(--space-6)',
              height: 'var(--btn-height-lg)',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-warning-bg)',
              color: 'var(--color-moss)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: `background-color var(--duration-base)`,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#EDE8D5')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-warning-bg)')}
          >
            List My Opportunity →
          </a>
        </div>
      </section>
    </>
  );
}
