'use client';

export function BottomCTA() {
  return (
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
        <p style={{ fontSize: 'var(--text-base)', color: 'rgba(240, 238, 224, 0.70)', lineHeight: 'var(--leading-relaxed)' }}>
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
            transition: 'background-color var(--duration-base)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#EDE8D5')}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-warning-bg)')}
        >
          List My Opportunity →
        </a>
      </div>
    </section>
  );
}
