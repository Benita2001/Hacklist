'use client';

import { useState, useEffect } from 'react';
import type { Hackathon } from '@/lib/types';
import { HackathonBrowser } from '@/components/home/HackathonBrowser';
import { UniversalCard, type TagItem } from '@/components/hackathon/UniversalCard';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';

/* ── Entity types ─────────────────────────────────────────── */

export interface WorldCupItem {
  id: string;
  name: string;
  organizer: string;
  description?: string | null;
  prize_pool: string | null;
  deadline: string | null;
  deadline_text: string | null;
  platform_type: string | null;
  apply_url: string | null;
}

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
  worldCupItems: WorldCupItem[];
}

/* ── Types ────────────────────────────────────────────────── */

type TabKey = 'campaigns' | 'hackathons' | 'bounties' | 'grants' | 'programs' | 'jobs';

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

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: 'var(--space-24) 0', textAlign: 'center' }}>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        No {label} listed yet. Check back soon.
      </p>
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

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ paddingBottom: 'var(--space-20)' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}>
        {children}
      </div>
    </section>
  );
}

/* ── Tab content grids ────────────────────────────────────── */

function BountiesTab({ bounties }: { bounties: Bounty[] }) {
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
      {filtered.length === 0 ? <EmptyState label="Bounties" /> : (
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

function GrantsTab({ grants }: { grants: Grant[] }) {
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
      {filtered.length === 0 ? <EmptyState label="Grants" /> : (
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

function ProgramsTab({ programs }: { programs: Program[] }) {
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
      {filtered.length === 0 ? <EmptyState label="Programs" /> : (
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

function JobsTab({ jobs }: { jobs: Job[] }) {
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
      {filtered.length === 0 ? <EmptyState label="Jobs" /> : (
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

/* ── World Cup Specials — carousel card ───────────────────── */

function WorldCupSpotlightCard({ item }: { item: WorldCupItem }) {
  return (
    <article
      className="flex flex-col md:flex-row"
      style={{
        backgroundColor: 'var(--card-bg-featured)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        border: '1px solid transparent',
        gap: 'var(--space-6)',
        position: 'relative',
        transition: 'border-color var(--duration-base) var(--ease-default)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
    >
      {/* Left: organizer + name + tags */}
      <div
        className="md:w-72"
        style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
      >
        <p
          className="truncate"
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            letterSpacing: 'var(--tracking-caps)',
            textTransform: 'uppercase',
            color: 'var(--color-olive-light)',
            maxWidth: '70%',
            display: 'block',
          }}
        >
          {item.organizer}
        </p>
        <h3
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '18px',
            fontWeight: 550,
            color: '#FFFFFF',
            lineHeight: 'var(--leading-snug)',
            letterSpacing: '-0.3px',
            marginTop: '8px',
          }}
        >
          {item.name}
        </h3>
        <div className="flex flex-wrap" style={{ gap: '6px' }}>
          {item.platform_type && <Tag label={item.platform_type} variant="format" />}
        </div>
      </div>

      {/* Vertical separator */}
      <div
        className="hidden md:block"
        style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.12)', flexShrink: 0, alignSelf: 'stretch' }}
        aria-hidden="true"
      />

      {/* Middle: description */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(240, 238, 224, 0.70)', lineHeight: 'var(--leading-relaxed)' }}>
          {item.description}
        </p>
      </div>

      {/* Vertical separator */}
      <div
        className="hidden md:block"
        style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.12)', flexShrink: 0, alignSelf: 'stretch' }}
        aria-hidden="true"
      />

      {/* Right: prize + deadline + apply */}
      <div
        className="md:w-44"
        style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 'var(--space-2)' }}
      >
        <p style={{
          fontSize: 'var(--text-2xs)',
          fontWeight: 500,
          letterSpacing: 'var(--tracking-caps)',
          textTransform: 'uppercase',
          color: 'var(--color-olive-light)',
        }}>
          Prize Pool
        </p>
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 400,
          color: '#FFFFFF',
          letterSpacing: '-0.3px',
          lineHeight: 1,
        }}>
          {item.prize_pool ?? 'Undisclosed'}
        </span>
        {item.deadline_text && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(240,238,224,0.5)' }}>
            {item.deadline_text}
          </span>
        )}
        {item.apply_url && (
          <a
            href={item.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#FFFFFF',
              color: 'var(--color-moss)',
              border: '1px solid transparent',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background-color var(--duration-base) var(--ease-default)',
              whiteSpace: 'nowrap',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.88)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#FFFFFF'; }}
          >
            Apply Now
          </a>
        )}
      </div>
    </article>
  );
}

/* ── World Cup Specials — auto-sliding carousel ───────────── */

function WorldCupCarousel({ items }: { items: WorldCupItem[] }) {
  const [current, setCurrent] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => setCurrent(c => (c + 1) % items.length), 4000);
    return () => clearInterval(id);
  }, [items.length, tick]);

  function goTo(idx: number) {
    setCurrent((idx + items.length) % items.length);
    setTick(t => t + 1);
  }

  const item = items[current];

  return (
    <section style={{ paddingBottom: 'var(--space-10)', position: 'relative', overflow: 'hidden' }}>
      {/* Video background */}
      <video
        src="/ScreenRecording_06-11-2026 16.mov"
        autoPlay
        muted
        loop
        playsInline
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />
      {/* Dark overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 1 }} />

      {/* Content sits above video + overlay */}
      <div style={{ position: 'relative', zIndex: 2 }}>

      {/* Section header — same style as existing Spotlight label */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <p style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-caps)',
          textTransform: 'uppercase',
          color: 'var(--color-moss)',
          marginBottom: 'var(--space-3)',
        }}>
          World Cup Specials ⚽
        </p>
        <div style={{ height: '1px', backgroundColor: 'var(--color-border-default)' }} />
      </div>

      {/* Card + arrow overlay */}
      <div style={{ position: 'relative' }}>
        <WorldCupSpotlightCard item={item} />

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label="Previous slide"
              style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color var(--duration-base) var(--ease-default)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.28)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label="Next slide"
              style={{
                position: 'absolute',
                right: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color var(--duration-base) var(--ease-default)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.28)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: 'var(--space-4)' }}>
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === current ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                backgroundColor: i === current ? 'var(--color-moss)' : 'var(--color-border-strong)',
                transition: 'all var(--duration-base) var(--ease-default)',
              }}
            />
          ))}
        </div>
      )}

      </div>{/* end content zIndex wrapper */}
    </section>
  );
}

/* ── Campaigns tab ────────────────────────────────────────── */

function CampaignsTab({ items }: { items: WorldCupItem[] }) {
  return (
    <section style={{ paddingBottom: 'var(--space-20)' }}>
      <TabSectionHeader>All Campaigns</TabSectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)', alignItems: 'stretch' }}>
        {items.map((item, i) => (
          <UniversalCard
            key={item.id}
            id={item.id}
            name={item.name}
            organizer={item.organizer}
            description={item.description}
            prizeLabel="Prize Pool"
            prizeValue={item.prize_pool}
            deadline={item.deadline}
            deadline_text={item.deadline_text}
            apply_url={item.apply_url}
            tags={item.platform_type ? [{ label: item.platform_type, variant: 'format' as const }] : []}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Main component ───────────────────────────────────────── */

export function TabBrowser({ hackathons, bounties, grants, programs, jobs, worldCupItems }: TabBrowserProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('hackathons');

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    ...(worldCupItems.length > 0 ? [{ key: 'campaigns' as TabKey, label: 'Campaigns ⚽', count: worldCupItems.length }] : []),
    { key: 'hackathons', label: 'Hackathons', count: hackathons.length },
    { key: 'bounties',   label: 'Bounties',   count: bounties.length   },
    { key: 'grants',     label: 'Grants',     count: grants.length     },
    { key: 'programs',   label: 'Programs',   count: programs.length   },
    { key: 'jobs',       label: 'Jobs',       count: jobs.length       },
  ];

  return (
    <div>

      {/* ── World Cup Specials carousel — hidden when no items ── */}
      {worldCupItems.length > 0 && <WorldCupCarousel items={worldCupItems} />}

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
      {activeTab === 'campaigns'  && <CampaignsTab items={worldCupItems} />}
      {activeTab === 'hackathons' && <HackathonBrowser hackathons={hackathons} />}
      {activeTab === 'bounties'   && <BountiesTab bounties={bounties} />}
      {activeTab === 'grants'     && <GrantsTab grants={grants} />}
      {activeTab === 'programs'   && <ProgramsTab programs={programs} />}
      {activeTab === 'jobs'       && <JobsTab jobs={jobs} />}

    </div>
  );
}
