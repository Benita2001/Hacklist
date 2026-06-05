'use client';

import { FilterState, FilterKey, SortKey } from '@/lib/types';
import { Input } from '@/components/ui/Input';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const pills: Array<{ label: string; key: FilterKey | 'all' }> = [
  { label: 'All',               key: 'all' },
  { label: 'AI',                key: 'ai' },
  { label: 'Web3',              key: 'web3' },
  { label: 'Online',            key: 'online' },
  { label: 'Offline',           key: 'offline' },
  { label: 'Closing This Week', key: 'closing-soon' },
  { label: 'Free to Enter',     key: 'free' },
];

export function FilterBar({ filters, onChange, totalCount, filteredCount }: FilterBarProps) {
  function handlePillClick(key: FilterKey | 'all') {
    if (key === 'all') {
      onChange({ ...filters, activeFilters: [] });
      return;
    }
    const current  = filters.activeFilters;
    const isActive = current.includes(key);
    const next     = isActive ? current.filter(k => k !== key) : [...current, key];
    onChange({ ...filters, activeFilters: next });
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...filters, sortBy: e.target.value as SortKey });
  }

  function handleSearchChange(value: string) {
    onChange({ ...filters, searchQuery: value });
  }

  const isAllActive = filters.activeFilters.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

      {/* ── Row 1: Full-width search ───────────────────────── */}
      <div className="w-full">
        <Input
          value={filters.searchQuery}
          onChange={handleSearchChange}
          placeholder="Search hackathons…"
        />
      </div>

      {/* ── Row 2: Filter pills | sort | count ─────────────── */}
      <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>

        {/* Pills — scrollable, left-aligned, flex-1 */}
        <div
          className="filter-pills flex items-center"
          style={{ flexWrap: 'nowrap', overflowX: 'auto', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}
        >
          {pills.map(({ label, key }) => {
            const isActive = key === 'all' ? isAllActive : filters.activeFilters.includes(key as FilterKey);
            return (
              <button
                key={key}
                type="button"
                onClick={() => handlePillClick(key)}
                aria-pressed={isActive}
                className="whitespace-nowrap shrink-0"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  fontSize: 'var(--text-xs)',
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all var(--duration-base) var(--ease-default)',
                  backgroundColor: isActive ? 'var(--pill-bg-active)' : 'transparent',
                  borderColor:     isActive ? 'var(--pill-bg-active)' : 'var(--pill-border)',
                  color:           isActive ? 'var(--pill-text-active)' : 'var(--pill-text)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Sort — shrink-0 */}
        <div className="relative shrink-0">
          <select
            value={filters.sortBy}
            onChange={handleSortChange}
            aria-label="Sort hackathons"
            style={{
              appearance: 'none',
              padding: '5px var(--space-8) 5px var(--space-3)',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              outline: 'none',
              whiteSpace: 'nowrap',
              transition: 'border-color var(--duration-base) var(--ease-default)',
            }}
          >
            <option value="deadline">Deadline soonest</option>
            <option value="prize">Prize largest</option>
            <option value="recent">Recently added</option>
          </select>
          <span
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--color-text-muted)',
            }}
            aria-hidden="true"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {/* Result count — far right, muted */}
        <span
          className="shrink-0"
          style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}
        >
          {filteredCount}/{totalCount}
        </span>

      </div>

    </div>
  );
}
