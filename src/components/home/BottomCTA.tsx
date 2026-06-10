'use client';

export function BottomCTA() {
  return (
    <section
      style={{
        backgroundColor: '#3D4820',
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
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 400,
            color: '#F5F2EB',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: '-0.5px',
          }}
        >
          Know an opportunity we&apos;re missing?
        </h2>
        <p style={{ fontSize: 'var(--text-base)', color: 'rgba(245, 242, 235, 0.7)', lineHeight: 'var(--leading-relaxed)' }}>
          Get any hackathon, bounty, grant, program or job in front of thousands of AI and Web3 builders actively looking for their next opportunity.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="/submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: '50px',
              backgroundColor: '#F2B84B',
              color: '#1A3A1A',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background-color var(--duration-base)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#E0A83A')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#F2B84B')}
          >
            List My Opportunity
          </a>
          <a
            href="https://t.me/hacklistwithbeni"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: '50px',
              backgroundColor: 'transparent',
              border: '1px solid #FFFFFF',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'opacity var(--duration-base)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.75')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}
          >
            Join on Telegram
          </a>
        </div>
      </div>
    </section>
  );
}
