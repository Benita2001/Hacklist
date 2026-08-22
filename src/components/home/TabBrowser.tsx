'use client';

import { useState } from 'react';
import type { Hackathon } from '@/lib/types';
import { HackathonBrowser } from '@/components/home/HackathonBrowser';
import { HackathonCard } from '@/components/hackathon/HackathonCard';
import { UniversalCard, type TagItem } from '@/components/hackathon/UniversalCard';
import { Input } from '@/components/ui/Input';
import { CatalogueReadState, type CatalogueStatus } from '@/components/home/CatalogueReadState';

/* ── Entity types ─────────────────────────────────────────── */

export interface Bounty {
  id: string;
  name: string;
  organizer: string;
  description?: string | null;
  reward: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: 'AI' | 'Web3' | 'Both';
  platform: string | null;
  type?: string | null;
  apply_url: string | null;
  spotlight: boolean;
  verified: boolean;
}

export interface Grant {
  id: string;
  name: string;
  organizer: string;
  description?: string | null;
  amount: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: 'AI' | 'Web3' | 'Both';
  ecosystem: string | null;
  format: string | null;
  free_to_apply: boolean;
  type?: string | null;
  apply_url: string | null;
  spotlight: boolean;
  verified: boolean;
}

export interface Program {
  id: string;
  name: string;
  organizer: string;
  description?: string | null;
  stipend: string | null;
  duration: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: 'AI' | 'Web3' | 'Both';
  format: string | null;
  type: string;
  apply_url: string | null;
  spotlight: boolean;
  verified: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description?: string | null;
  salary: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: 'AI' | 'Web3' | 'Both';
  format: string | null;
  location: string | null;
  employment_type?: string | null;
  job_type?: string | null;
  created_at?: string | null;
  apply_url: string | null;
  spotlight: boolean;
  verified: boolean;
}

/* ── Props ────────────────────────────────────────────────── */

interface TabBrowserProps {
  hackathons: Hackathon[];
  bounties: Bounty[];
  grants: Grant[];
  programs: Program[];
  jobs: Job[];
  statuses?: {
    hackathons: CatalogueStatus;
    bounties: CatalogueStatus;
    grants: CatalogueStatus;
    programs: CatalogueStatus;
    jobs: CatalogueStatus;
  };
}

/* ── Types ────────────────────────────────────────────────── */

type TabKey = 'hackathons' | 'bounties' | 'grants' | 'programs' | 'jobs';

/* ── Tag helpers ──────────────────────────────────────────── */

type CategoryVariant = 'ai' | 'web3' | 'both';
function categoryVariant(cat: 'AI' | 'Web3' | 'Both'): CategoryVariant {
  if (cat === 'AI')   return 'ai';
  if (cat === 'Web3') return 'web3';
  return 'both';
}

const programTypeStyles: Record<string, React.CSSProperties> = {
  Fellowship:  { backgroundColor: '#EEEDFE', color: '#3C3489', border: '1px solid #D5D4F8' },
  Accelerator: { backgroundColor: '#E6F1FB', color: '#0C447C', border: '1px solid #C4DCEF' },
  Incubator:   { backgroundColor: '#FAEEDA', color: '#633806', border: '1px solid #F0D6A8' },
};

function buildBountyTags(b: Bounty): TagItem[] {
  const tags: TagItem[] = [{ label: b.category, variant: categoryVariant(b.category) }];
  if (b.platform) tags.push({ label: b.platform, variant: 'format' });
  return tags;
}

function buildGrantTags(g: Grant): TagItem[] {
  const tags: TagItem[] = [{ label: g.category, variant: categoryVariant(g.category) }];
  if (g.ecosystem) tags.push({ label: g.ecosystem, variant: 'format' });
  if (g.format)    tags.push({ label: g.format,    variant: 'format' });
  if (g.free_to_apply) tags.push({ label: 'Free', variant: 'format' });
  return tags;
}

function buildProgramTags(p: Program): TagItem[] {
  const tags: TagItem[] = [{ label: p.category, variant: categoryVariant(p.category) }];
  if (p.format) tags.push({ label: p.format, variant: 'format' });
  if (p.type) {
    const custom = programTypeStyles[p.type];
    tags.push(
      custom
        ? { label: p.type, variant: 'custom', customStyle: custom }
        : { label: p.type, variant: 'format' }
    );
  }
  return tags;
}

function buildJobTags(j: Job): TagItem[] {
  const tags: TagItem[] = [{ label: j.category, variant: categoryVariant(j.category) }];
  if (j.format)   tags.push({ label: j.format,   variant: 'format' });
  if (j.location) tags.push({ label: j.location, variant: 'format' });
  return tags;
}

/* ── Filter logic ─────────────────────────────────────────── */

function filterBounties(items: Bounty[], f: string): Bounty[] {
  if (f === 'All')     return items;
  if (f === 'AI')      return items.filter(b => b.category === 'AI');
  if (f === 'Web3')    return items.filter(b => b.category === 'Web3');
  if (f === 'Writing') return items.filter(b => b.platform === 'Writing' || b.type === 'Writing');
  if (f === 'Video')   return items.filter(b => b.platform === 'Video'   || b.type === 'Video');
  return items.filter(b => b.type === f);
}

function filterGrants(items: Grant[], f: string): Grant[] {
  if (f === 'All')  return items;
  if (f === 'AI')   return items.filter(g => g.category === 'AI');
  if (f === 'Web3') return items.filter(g => g.category === 'Web3');
  return items.filter(g => g.type === f);
}

function filterJobs(items: Job[], f: string): Job[] {
  if (f === 'All')           return items;
  if (f === 'AI')            return items.filter(j => j.category === 'AI');
  if (f === 'Web3')          return items.filter(j => j.category === 'Web3');
  if (f === 'Remote')        return items.filter(j =>
    j.format?.toLowerCase() === 'remote' ||
    j.location?.toLowerCase().includes('remote')
  );
  if (f === 'Technical')     return items.filter(j => j.job_type === 'Technical');
  if (f === 'Non-Technical') return items.filter(j => j.job_type === 'Non-Technical');
  return items;
}

/* ── Empty state ──────────────────────────────────────────── */

function EmptyState({ label, status = 'ready' }: { label: string; status?: CatalogueStatus }) {
  return (
    <div style={{ padding: 'var(--space-24) 0', textAlign: 'center' }}>
      <CatalogueReadState label={label} status={status} />
    </div>
  );
}

/* ── Tab section header ───────────────────────────────────── */

function TabSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <p style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-caps)',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-3)',
      }}>
        {children}
      </p>
      <div style={{ height: '1px', backgroundColor: 'var(--color-border-default)' }} />
    </div>
  );
}

/* ── Shared pill style ────────────────────────────────────── */

function pillStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all var(--duration-base) var(--ease-default)',
    backgroundColor: isActive ? 'var(--pill-bg-active)' : 'transparent',
    borderColor:     isActive ? 'var(--pill-bg-active)' : 'var(--pill-border)',
    color:           isActive ? 'var(--pill-text-active)' : 'var(--pill-text)',
  };
}

/* ── Filter pill row ──────────────────────────────────────── */

function FilterPills({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className="shrink-0"
          style={pillStyle(value === opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ── Card grid wrapper ────────────────────────────────────── */

/* ── Tab content grids ────────────────────────────────────── */

function BountiesTab({ bounties, status }: { bounties: Bounty[]; status: CatalogueStatus }) {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.trim().toLowerCase();
  const searchFiltered = q
    ? bounties.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.organizer.toLowerCase().includes(q)
      )
    : bounties;
  const filtered = filterBounties(searchFiltered, filter);

  return (
    <section style={{ paddingBottom: 'var(--space-20)' }}>
      <TabSectionHeader>All Bounties</TabSectionHeader>
      <div className="w-full" style={{ marginBottom: 'var(--space-3)' }}>
        <Input value={searchQuery} onChange={setSearchQuery} placeholder="Search bounties..." />
      </div>
      <FilterPills
        options={['All', 'AI', 'Web3', 'Technical', 'Writing', 'Video', 'Design']}
        value={filter}
        onChange={setFilter}
      />
      {filtered.length === 0 ? <EmptyState label="Bounties" status={status} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}>
          {filtered.map((b, i) => (
            <UniversalCard
              key={b.id}
              id={b.id}
              name={b.name}
              organizer={b.organizer}
              description={b.description}
              prizeLabel="Reward"
              prizeValue={b.reward}
              deadline={b.deadline}
              deadline_text={b.deadline_text}
              apply_url={b.apply_url}
              tags={buildBountyTags(b)}
              href={`/bounty/${b.id}`}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function GrantsTab({ grants, status }: { grants: Grant[]; status: CatalogueStatus }) {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.trim().toLowerCase();
  const searchFiltered = q
    ? grants.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.organizer.toLowerCase().includes(q)
      )
    : grants;
  const filtered = filterGrants(searchFiltered, filter);

  return (
    <section style={{ paddingBottom: 'var(--space-20)' }}>
      <TabSectionHeader>All Grants</TabSectionHeader>
      <div className="w-full" style={{ marginBottom: 'var(--space-3)' }}>
        <Input value={searchQuery} onChange={setSearchQuery} placeholder="Search grants..." />
      </div>
      <FilterPills
        options={['All', 'AI', 'Web3', 'Open Source', 'Research', 'Education']}
        value={filter}
        onChange={setFilter}
      />
      {filtered.length === 0 ? <EmptyState label="Grants" status={status} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}>
          {filtered.map((g, i) => (
            <UniversalCard
              key={g.id}
              id={g.id}
              name={g.name}
              organizer={g.organizer}
              description={g.description}
              prizeLabel="Amount"
              prizeValue={g.amount}
              deadline={g.deadline}
              deadline_text={g.deadline_text}
              apply_url={g.apply_url}
              tags={buildGrantTags(g)}
              href={`/grant/${g.id}`}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProgramsTab({ programs, status }: { programs: Program[]; status: CatalogueStatus }) {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.trim().toLowerCase();
  const searchFiltered = q
    ? programs.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.organizer.toLowerCase().includes(q)
      )
    : programs;
  const filtered = filter === 'All' ? searchFiltered : searchFiltered.filter(p => p.type === filter);

  return (
    <section style={{ paddingBottom: 'var(--space-20)' }}>
      <TabSectionHeader>All Programs</TabSectionHeader>
      <div className="w-full" style={{ marginBottom: 'var(--space-3)' }}>
        <Input value={searchQuery} onChange={setSearchQuery} placeholder="Search programs..." />
      </div>
      <FilterPills
        options={['All', 'Fellowship', 'Accelerator', 'Incubator']}
        value={filter}
        onChange={setFilter}
      />
      {filtered.length === 0 ? <EmptyState label="Programs" status={status} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}>
          {filtered.map((p, i) => (
            <UniversalCard
              key={p.id}
              id={p.id}
              name={p.name}
              organizer={p.organizer}
              description={p.description}
              prizeLabel="Stipend"
              prizeValue={p.stipend}
              deadline={p.deadline}
              deadline_text={p.deadline_text}
              apply_url={p.apply_url}
              tags={buildProgramTags(p)}
              href={`/program/${p.id}`}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function JobsTab({ jobs, status }: { jobs: Job[]; status: CatalogueStatus }) {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.trim().toLowerCase();
  const searchFiltered = q
    ? jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q)
      )
    : jobs;
  const filtered = filterJobs(searchFiltered, filter);

  return (
    <section style={{ paddingBottom: 'var(--space-20)' }}>
      <TabSectionHeader>All Jobs</TabSectionHeader>
      <div className="w-full" style={{ marginBottom: 'var(--space-3)' }}>
        <Input value={searchQuery} onChange={setSearchQuery} placeholder="Search jobs..." />
      </div>
      <FilterPills
        options={['All', 'AI', 'Web3', 'Remote', 'Technical', 'Non-Technical']}
        value={filter}
        onChange={setFilter}
      />
      {filtered.length === 0 ? <EmptyState label="Jobs" status={status} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}>
          {filtered.map((j, i) => (
            <UniversalCard
              key={j.id}
              id={j.id}
              name={j.title}
              organizer={j.company}
              description={j.description}
              prizeLabel="Salary"
              prizeValue={j.salary}
              deadline={j.deadline}
              deadline_text={j.deadline_text}
              apply_url={j.apply_url}
              tags={buildJobTags(j)}
              href={`/job/${j.id}`}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Tab bar pill style ───────────────────────────────────── */

function tabPillStyle(): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 14px',
    borderRadius: '6px',
    border: '1px solid var(--color-moss)',
    backgroundColor: 'transparent',
    color: 'var(--color-moss)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: `background-color var(--duration-base) var(--ease-default),
                 color var(--duration-base) var(--ease-default)`,
  };
}

/* ── Main component ───────────────────────────────────────── */

export function TabBrowser({ hackathons, bounties, grants, programs, jobs, statuses }: TabBrowserProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('hackathons');

  const readStatuses = statuses ?? {
    hackathons: 'ready' as const,
    bounties: 'ready' as const,
    grants: 'ready' as const,
    programs: 'ready' as const,
    jobs: 'ready' as const,
  };

  const spotlightHackathon     = hackathons.find(h => h.spotlight);
  const nonSpotlightHackathons = hackathons.filter(h => !h.spotlight);

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: 'hackathons', label: 'Hackathons', count: hackathons.length },
    { key: 'bounties',   label: 'Bounties',   count: bounties.length   },
    { key: 'grants',     label: 'Grants',     count: grants.length     },
    { key: 'programs',   label: 'Programs',   count: programs.length   },
    { key: 'jobs',       label: 'Jobs',       count: jobs.length       },
  ];

  return (
    <div>

      {/* ── Spotlight — above tabs ── */}
      {spotlightHackathon && (
        <section style={{ paddingBottom: 'var(--space-10)' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <p style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-caps)',
              textTransform: 'uppercase',
              color: 'var(--color-moss)',
              marginBottom: 'var(--space-3)',
            }}>
              Spotlight
            </p>
            <div style={{ height: '1px', backgroundColor: 'var(--color-border-default)' }} />
          </div>
          <HackathonCard hackathon={spotlightHackathon} spotlight index={0} />
        </section>
      )}

      {/* ── Tab bar ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: 'var(--space-6)',
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            style={tabPillStyle()}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.backgroundColor = '#3D4820';
              el.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.backgroundColor = 'transparent';
              el.style.color = 'var(--color-moss)';
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'hackathons' && <HackathonBrowser hackathons={nonSpotlightHackathons} status={readStatuses.hackathons} />}
      {activeTab === 'bounties'   && <BountiesTab bounties={bounties} status={readStatuses.bounties} />}
      {activeTab === 'grants'     && <GrantsTab grants={grants} status={readStatuses.grants} />}
      {activeTab === 'programs'   && <ProgramsTab programs={programs} status={readStatuses.programs} />}
      {activeTab === 'jobs'       && <JobsTab jobs={jobs} status={readStatuses.jobs} />}

    </div>
  );
}
