'use client';

import { useState } from 'react';
import { Hackathon, FilterState } from '@/lib/types';
import { filterHackathons } from '@/lib/data';
import { FilterBar } from '@/components/hackathon/FilterBar';
import { HackathonCard } from '@/components/hackathon/HackathonCard';

interface HackathonBrowserProps {
  hackathons: Hackathon[];
}

const initialFilters: FilterState = {
  activeFilters: [],
  sortBy: 'deadline',
  searchQuery: '',
};

const sectionLabelStyle = {
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
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

export function HackathonBrowser({ hackathons }: HackathonBrowserProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const filtered  = filterHackathons(hackathons, filters);
  const spotlight = filtered.find(h => h.spotlight);
  const regular   = filtered.filter(h => !h.spotlight);

  if (hackathons.length === 0) {
    return (
      <section style={{ paddingBottom: 'var(--space-20)' }}>
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{ padding: 'var(--space-24) 0' }}
        >
          <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
            No active hackathons right now. Check back soon. We update weekly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Spotlight */}
      {spotlight && (
        <section style={{ paddingBottom: 'var(--space-10)' }}>
          <SectionHeader color="var(--color-moss)">Hackathon Spotlight</SectionHeader>
          <HackathonCard hackathon={spotlight} spotlight index={0} />
        </section>
      )}

      {/* All Hackathons */}
      <section style={{ paddingBottom: 'var(--space-20)' }}>
        <SectionHeader color="var(--color-text-muted)">All Hackathons</SectionHeader>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          totalCount={hackathons.length}
          filteredCount={filtered.length}
        />

        {regular.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ padding: 'var(--space-24) 0', gap: 'var(--space-4)' }}
          >
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
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
      </section>
    </>
  );
}
