import { Hackathon } from '@/lib/types';
import { HackathonCard } from './HackathonCard';

interface HackathonGridProps {
  hackathons: Hackathon[];
  spotlight?: Hackathon;
  noActiveHackathons?: boolean;
}

const sectionLabel = {
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase' as const,
} as const;

function SectionHeader({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <p style={{ ...sectionLabel, color, marginBottom: 'var(--space-3)' }}>
        {children}
      </p>
      <div style={{ height: '1px', backgroundColor: 'var(--color-border-default)' }} />
    </div>
  );
}

function AllExpiredState() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: 'var(--space-24) 0' }}
    >
      <p
        style={{
          fontSize: 'var(--text-md)',
          color: 'var(--color-text-muted)',
          lineHeight: 'var(--leading-relaxed)',
        }}
      >
        No active hackathons right now. Check back soon. We update weekly.
      </p>
    </div>
  );
}

function NoResultsState() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: 'var(--space-24) 0', gap: 'var(--space-4)' }}
    >
      <svg
        width="48" height="48" viewBox="0 0 48 48" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <circle cx="21" cy="21" r="13" stroke="currentColor" strokeWidth="2" />
        <line x1="30.5" y1="30.5" x2="42" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="21" x2="26" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          No hackathons found
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Try adjusting your filters or search.
        </p>
      </div>
    </div>
  );
}

export function HackathonGrid({ hackathons, spotlight, noActiveHackathons }: HackathonGridProps) {
  const hasContent = !!spotlight || hackathons.length > 0;

  if (!hasContent) {
    return noActiveHackathons ? <AllExpiredState /> : <NoResultsState />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>

      {/* Spotlight section */}
      {spotlight && (
        <section>
          <SectionHeader color="var(--color-moss)">
            Hackathon Spotlight
          </SectionHeader>
          <HackathonCard hackathon={spotlight} spotlight index={0} />
        </section>
      )}

      {/* All other hackathons */}
      {hackathons.length > 0 && (
        <section>
          <SectionHeader color="var(--color-text-muted)">
            All Hackathons
          </SectionHeader>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}
          >
            {hackathons.map((hackathon, index) => (
              <HackathonCard
                key={hackathon.id}
                hackathon={hackathon}
                index={index}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
