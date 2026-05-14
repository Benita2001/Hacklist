'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllHackathons, filterHackathons } from '@/lib/data';
import { FilterState } from '@/lib/types';
import { PageShell } from '@/components/layout/PageShell';
import { FilterBar } from '@/components/hackathon/FilterBar';
import { HackathonCard } from '@/components/hackathon/HackathonCard';

const allHackathons = getAllHackathons();

const initialFilters: FilterState = {
  activeFilters: [],
  sortBy:        'deadline',
  searchQuery:   '',
};

const sectionLabelStyle = {
  fontSize:      'var(--text-xs)',
  fontWeight:    500,
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase' as const,
} as const;

function SectionHeader({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <p style={{ ...sectionLabelStyle, color, marginBottom: 'var(--space-3)' }}>
        {children}
      </p>
      <div style={{ height: '1px', backgroundColor: 'var(--color-border-default)' }} />
    </div>
  );
}

export default function HomePage() {
  const [filters, setFilters]     = useState<FilterState>(initialFilters);
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const prizeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = prizeRef.current;
    if (!el) return;
    const end = 10105000;
    const duration = 2000;
    const startTime = performance.now();
    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * end);
      el.textContent = '$' + current.toLocaleString() + '+';
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }, []);

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
        <section style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-10)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>

            {/* Headline */}
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(48px, 7vw, 72px)',
                lineHeight: 'var(--leading-tight)',
                letterSpacing: '-0.02em',
                margin: '0 auto var(--space-6)',
              }}
            >
              <span style={{ display: 'block', fontWeight: 500, fontStyle: 'normal', color: 'var(--color-moss)' }}>
                The fastest way to find
              </span>
              <span style={{ display: 'block', fontWeight: 400, fontStyle: 'normal', color: 'var(--color-moss)' }}>
                AI &amp; Web3 hackathons
              </span>
              <em style={{ display: 'block', fontWeight: 400, fontStyle: 'italic', color: 'var(--color-moss)' }}>
                worth your time.
              </em>
            </h1>

            {/* Prize number */}
            <div style={{ margin: '0 auto var(--space-8)', paddingTop: 'var(--space-3)' }}>
              <span
                ref={prizeRef}
                className="font-serif"
                style={{
                  fontSize: '64px',
                  fontWeight: 400,
                  color: 'var(--color-moss)',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  display: 'block',
                  marginBottom: 'var(--space-2)',
                }}
              >
                $0+
              </span>
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                in active prizes waiting for you
              </span>
            </div>

            {/* Email capture */}
            <div style={{ maxWidth: '520px', margin: '0 auto' }}>
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
                  You&apos;re in. Hackathons every Monday, straight to your inbox.
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
                      placeholder="Enter your email to access hackathon opportunities"
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
                </>
              )}
            </div>

          </div>
        </section>

        {/* ── Spotlight ────────────────────────────────────────── */}
        {spotlight && (
          <section style={{ paddingBottom: 'var(--space-10)' }}>
            <SectionHeader color="var(--color-moss)">Hackathon Spotlight</SectionHeader>
            <HackathonCard hackathon={spotlight} spotlight index={0} />
          </section>
        )}

        {/* ── All Hackathons ───────────────────────────────────── */}
        <section style={{ paddingBottom: 'var(--space-20)' }}>
          {allHackathons.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ padding: 'var(--space-24) 0' }}
            >
              <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
                No active hackathons right now. Check back soon. We update weekly.
              </p>
            </div>
          ) : (
            <>
              <SectionHeader color="var(--color-text-muted)">All Hackathons</SectionHeader>

              <FilterBar
                filters={filters}
                onChange={setFilters}
                totalCount={allHackathons.length}
                filteredCount={filtered.length}
              />

              {regular.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center text-center"
                  style={{ padding: 'var(--space-24) 0', gap: 'var(--space-4)' }}
                >
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    No hackathons found
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    Try adjusting your filters or search.
                  </p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  style={{ gap: 'var(--space-5)', alignItems: 'stretch', marginTop: 'var(--space-5)' }}
                >
                  {regular.map((hackathon, index) => (
                    <HackathonCard
                      key={hackathon.id}
                      hackathon={hackathon}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

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
