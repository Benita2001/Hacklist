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
    const current   = filters.activeFilters;
    const isActive  = current.includes(key);
    const next      = isActive ? current.filter(k => k !== key) : [...current, key];
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

      {/* ── Count + Search + Sort ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>

        <span style={{ flexShrink: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {filteredCount} of {totalCount} hackathon{totalCount === 1 ? '' : 's'}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Input
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search hackathons…"
          />
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={filters.sortBy}
            onChange={handleSortChange}
            aria-label="Sort hackathons"
            style={{
              appearance: 'none',
              height: 'var(--pill-height)',
              paddingLeft: 'var(--space-3)',
              paddingRight: 'var(--space-8)',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              outline: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <option value="deadline">Deadline soonest</option>
            <option value="prize">Prize largest</option>
            <option value="recent">Recently added</option>
          </select>
          <span
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--color-text-secondary)',
            }}
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>

      {/* ── Filter pills ───────────────────────────────────── */}
      <div
        className="flex flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: 'var(--space-2)' }}
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
                height: 'var(--pill-height)',
                padding: '0 var(--pill-px)',
                borderRadius: 'var(--pill-radius)',
                border: '1px solid',
                fontSize: 'var(--text-sm)',
                fontWeight: isActive ? 500 : 400,
                cursor: 'pointer',
                transition: 'background-color var(--duration-base), border-color var(--duration-base), color var(--duration-base)',
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

    </div>
  );
}
