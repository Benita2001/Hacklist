export const revalidate = 300; // rebuild from Supabase at most every 5 minutes

import { getHackathonsResult, type CatalogueRead } from '@/lib/data';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { PageShell } from '@/components/layout/PageShell';
import { HeroSection } from '@/components/home/HeroSection';
import { TabBrowser, type Bounty, type Grant, type Program, type Job } from '@/components/home/TabBrowser';
import { BottomCTA } from '@/components/home/BottomCTA';

type ReadStatus = 'ready' | 'unavailable' | 'error';

type CatalogueResult<T> = CatalogueRead<T>;

async function getBounties(): Promise<CatalogueResult<Bounty>> {
  const supabase = getSupabase();
  if (!supabase) return { data: [], status: 'unavailable' };
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('bounties')
    .select('*')
    .eq('verified', true)
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) { console.error('[catalogue/bounties]', { code: error.code, message: error.message }); return { data: [], status: 'error' }; }
  return { data: (data ?? []) as Bounty[], status: 'ready' };
}

async function getGrants(): Promise<CatalogueResult<Grant>> {
  const supabase = getSupabase();
  if (!supabase) return { data: [], status: 'unavailable' };
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('grants')
    .select('*')
    .eq('verified', true)
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) { console.error('[catalogue/grants]', { code: error.code, message: error.message }); return { data: [], status: 'error' }; }
  return { data: (data ?? []) as Grant[], status: 'ready' };
}

async function getPrograms(): Promise<CatalogueResult<Program>> {
  const supabase = getSupabase();
  if (!supabase) return { data: [], status: 'unavailable' };
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('verified', true)
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) { console.error('[catalogue/programs]', { code: error.code, message: error.message }); return { data: [], status: 'error' }; }
  return { data: (data ?? []) as Program[], status: 'ready' };
}

async function getJobs(): Promise<CatalogueResult<Job>> {
  const supabase = getSupabase();
  if (!supabase) return { data: [], status: 'unavailable' };
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('verified', true)
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) { console.error('[catalogue/jobs]', { code: error.code, message: error.message }); return { data: [], status: 'error' }; }

  // Fix 1: deduplicate by id (guards against duplicate DB rows)
  const seen = new Set<string>();
  const unique = (data ?? []).filter((j) => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  }) as Job[];

  // Fix 3: hide no-deadline jobs older than 8 days
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
  const active = unique.filter((job) => {
    if (job.deadline) return true;
    if (!job.created_at) return true; // no timestamp → keep
    return new Date(job.created_at) > eightDaysAgo;
  });

  // Fix 2: salary-disclosed jobs first, deadline order preserved within each group
  return { data: [...active].sort((a, b) => {
    const aHasSalary = !!(a.salary && a.salary.toLowerCase() !== 'undisclosed');
    const bHasSalary = !!(b.salary && b.salary.toLowerCase() !== 'undisclosed');
    if (aHasSalary && !bHasSalary) return -1;
    if (!aHasSalary && bHasSalary) return 1;
    return 0;
  }), status: 'ready' };
}

export default async function HomePage() {
  const [hackathons, bounties, grants, programs, jobs] = await Promise.all([
    getHackathonsResult(),
    getBounties(),
    getGrants(),
    getPrograms(),
    getJobs(),
  ]);

  const statuses: ReadStatus[] = [hackathons.status, bounties.status, grants.status, programs.status, jobs.status];
  const catalogueUnavailable = statuses.some(status => status !== 'ready');

  return (
    <>
      <PageShell>
        {(catalogueUnavailable || !isSupabaseConfigured()) && (
          <div
            role="status"
            style={{
              marginBottom: 'var(--space-6)',
              padding: 'var(--space-4)',
              border: '1px solid var(--color-warning-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-warning-text)',
              backgroundColor: 'var(--color-warning-bg)',
            }}
          >
            The opportunity catalogue is temporarily unavailable. {isSupabaseConfigured() ? 'Please retry shortly.' : <>Add the Supabase values from <code>.env.example</code> and refresh.</>}
          </div>
        )}
        <HeroSection />
        <TabBrowser
          hackathons={hackathons.data}
          bounties={bounties.data}
          grants={grants.data}
          programs={programs.data}
          jobs={jobs.data}
        />
      </PageShell>
      <BottomCTA />
    </>
  );
}
