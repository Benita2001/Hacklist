'use client';

import { useState } from 'react';
import type { Hackathon } from '@/lib/types';
import { HackathonBrowser } from '@/components/home/HackathonBrowser';
import { UniversalCard, type TagItem } from '@/components/hackathon/UniversalCard';

/* ── Entity types ─────────────────────────────────────────── */

export interface Bounty {
  id: string;
  name: string;
  organizer: string;
  reward: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: 'AI' | 'Web3' | 'Both';
  platform: string | null;
  apply_url: string | null;
  spotlight: boolean;
  verified: boolean;
}

export interface Grant {
  id: string;
  name: string;
  organizer: string;
  amount: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: 'AI' | 'Web3' | 'Both';
  ecosystem: string | null;
  format: string | null;
  free_to_apply: boolean;
  apply_url: string | null;
  spotlight: boolean;
  verified: boolean;
}

export interface Program {
  id: string;
  name: string;
  organizer: string;
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
  salary: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: 'AI' | 'Web3' | 'Both';
  format: string | null;
  location: string | null;
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
}

/* ── Helpers ──────────────────────────────────────────────── */

type TabKey = 'hackathons' | 'bounties' | 'grants' | 'programs' | 'jobs';
type ProgramTypeFilter = 'All' | 'Fellowship' | 'Accelerator' | 'Incubator';

type CategoryVariant = 'ai' | 'web3' | 'both';
function categoryVariant(cat: 'AI' | 'Web3' | 'Both'): CategoryVariant {
  if (cat === 'AI')   return 'ai';
  if (cat === 'Web3') return 'web3';
  return 'both';
}

const programTypeStyles: Record<string, React.CSSProperties> = {
  Fellowship: {
    backgroundColor: '#EEEDFE',
    color: '#3C3489',
    border: '1px solid #D5D4F8',
  },
  Accelerator: {
    backgroundColor: '#E6F1FB',
    color: '#0C447C',
    border: '1px solid #C4DCEF',
  },
  Incubator: {
    backgroundColor: '#FAEEDA',
    color: '#633806',
    border: '1px solid #F0D6A8',
  },
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

/* ── Shared card grid ─────────────────────────────────────── */

const cardGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(1, 1fr)',
  gap: 'var(--space-5)',
  alignItems: 'stretch',
};

/* ── Empty state ──────────────────────────────────────────── */

function EmptyState({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: 'var(--space-24) 0',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        No {label} listed yet. Check back soon.
      </p>
    </div>
  );
}

/* ── Tab content grids ────────────────────────────────────── */

function BountiesGrid({ bounties }: { bounties: Bounty[] }) {
  if (bounties.length === 0) return <EmptyState label="Bounties" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}>
      {bounties.map((b, i) => (
        <UniversalCard
          key={b.id}
          id={b.id}
          name={b.name}
          organizer={b.organizer}
          prizeLabel="Reward"
          prizeValue={b.reward}
          deadline={b.deadline}
          deadline_text={b.deadline_text}
          apply_url={b.apply_url}
          tags={buildBountyTags(b)}
          index={i}
        />
      ))}
    </div>
  );
}

function GrantsGrid({ grants }: { grants: Grant[] }) {
  if (grants.length === 0) return <EmptyState label="Grants" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}>
      {grants.map((g, i) => (
        <UniversalCard
          key={g.id}
          id={g.id}
          name={g.name}
          organizer={g.organizer}
          prizeLabel="Amount"
          prizeValue={g.amount}
          deadline={g.deadline}
          deadline_text={g.deadline_text}
          apply_url={g.apply_url}
          tags={buildGrantTags(g)}
          index={i}
        />
      ))}
    </div>
  );
}

function ProgramsGrid({ programs }: { programs: Program[] }) {
  if (programs.length === 0) return <EmptyState label="Programs" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}>
      {programs.map((p, i) => (
        <UniversalCard
          key={p.id}
          id={p.id}
          name={p.name}
          organizer={p.organizer}
          prizeLabel="Stipend"
          prizeValue={p.stipend}
          deadline={p.deadline}
          deadline_text={p.deadline_text}
          apply_url={p.apply_url}
          tags={buildProgramTags(p)}
          index={i}
        />
      ))}
    </div>
  );
}

function JobsGrid({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) return <EmptyState label="Jobs" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}>
      {jobs.map((j, i) => (
        <UniversalCard
          key={j.id}
          id={j.id}
          name={j.title}
          organizer={j.company}
          prizeLabel="Salary"
          prizeValue={j.salary}
          deadline={j.deadline}
          deadline_text={j.deadline_text}
          apply_url={j.apply_url}
          tags={buildJobTags(j)}
          index={i}
        />
      ))}
    </div>
  );
}

/* ── Tab bar pill style ───────────────────────────────────── */

function tabPillStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 14px',
    borderRadius: '6px',
    border: '1px solid var(--color-moss)',
    backgroundColor: isActive ? 'var(--color-moss)' : 'transparent',
    color: isActive ? 'var(--btn-primary-text)' : 'var(--color-moss)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: `background-color var(--duration-base) var(--ease-default),
                 color var(--duration-base) var(--ease-default)`,
  };
}

/* ── Main component ───────────────────────────────────────── */

export function TabBrowser({ hackathons, bounties, grants, programs, jobs }: TabBrowserProps) {
  const [activeTab, setActiveTab]       = useState<TabKey>('hackathons');
  const [programType, setProgramType]   = useState<ProgramTypeFilter>('All');

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: 'hackathons', label: 'Hackathons', count: hackathons.length },
    { key: 'bounties',   label: 'Bounties',   count: bounties.length   },
    { key: 'grants',     label: 'Grants',     count: grants.length     },
    { key: 'programs',   label: 'Programs',   count: programs.length   },
    { key: 'jobs',       label: 'Jobs',       count: jobs.length       },
  ];

  const programTypeFilters: ProgramTypeFilter[] = ['All', 'Fellowship', 'Accelerator', 'Incubator'];

  const filteredPrograms =
    programType === 'All'
      ? programs
      : programs.filter(p => p.type === programType);

  return (
    <div>

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
            style={tabPillStyle(activeTab === tab.key)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* ── Programs secondary filter ── */}
      {activeTab === 'programs' && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-5)',
          }}
        >
          {programTypeFilters.map(type => {
            const isActive = programType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setProgramType(type)}
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
                {type}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Tab content ── */}
      {activeTab === 'hackathons' && <HackathonBrowser hackathons={hackathons} />}
      {activeTab === 'bounties'   && <BountiesGrid bounties={bounties} />}
      {activeTab === 'grants'     && <GrantsGrid grants={grants} />}
      {activeTab === 'programs'   && <ProgramsGrid programs={filteredPrograms} />}
      {activeTab === 'jobs'       && <JobsGrid jobs={jobs} />}

    </div>
  );
}
