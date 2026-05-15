import { Hackathon } from '@/lib/types';
import { HackathonCard } from './HackathonCard';

interface HackathonGridProps {
  hackathons: Hackathon[];
  spotlight?: Hackathon;
}

export function HackathonGrid({ hackathons, spotlight }: HackathonGridProps) {
  if (!spotlight && hackathons.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ padding: 'var(--space-24) 0' }}
      >
        <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
          No active hackathons right now. Check back soon. We update weekly.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
      {spotlight && <HackathonCard hackathon={spotlight} spotlight index={0} />}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}
      >
        {hackathons.map((hackathon, index) => (
          <HackathonCard key={hackathon.id} hackathon={hackathon} index={index} />
        ))}
      </div>
    </div>
  );
}
