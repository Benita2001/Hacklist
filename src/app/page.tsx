export const revalidate = 300; // rebuild from Supabase at most every 5 minutes

import { getHackathons } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { PageShell } from '@/components/layout/PageShell';
import { HeroSection } from '@/components/home/HeroSection';
import { TabBrowser, type Bounty, type Grant, type Program, type Job } from '@/components/home/TabBrowser';
import { BottomCTA } from '@/components/home/BottomCTA';
import { WebMcpAgentState } from '@/components/webmcp/WebMcpAgentState';
import { WebMcpRegistrar } from '@/components/webmcp/WebMcpRegistrar';

async function getBounties(): Promise<Bounty[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('bounties')
    .select('*')
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) { console.error('Supabase bounties error:', error); return []; }
  return (data ?? []) as Bounty[];
}

async function getGrants(): Promise<Grant[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('grants')
    .select('*')
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) { console.error('Supabase grants error:', error); return []; }
  return (data ?? []) as Grant[];
}

async function getPrograms(): Promise<Program[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) { console.error('Supabase programs error:', error); return []; }
  return (data ?? []) as Program[];
}

async function getJobs(): Promise<Job[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) { console.error('Supabase jobs error:', error); return []; }

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
  return [...active].sort((a, b) => {
    const aHasSalary = !!(a.salary && a.salary.toLowerCase() !== 'undisclosed');
    const bHasSalary = !!(b.salary && b.salary.toLowerCase() !== 'undisclosed');
    if (aHasSalary && !bHasSalary) return -1;
    if (!aHasSalary && bHasSalary) return 1;
    return 0;
  });
}

export default async function HomePage() {
  const [hackathons, bounties, grants, programs, jobs] = await Promise.all([
    getHackathons(),
    getBounties(),
    getGrants(),
    getPrograms(),
    getJobs(),
  ]);

  return (
    <>
      <WebMcpRegistrar />
      <PageShell>
        <HeroSection />
        <WebMcpAgentState />
        <TabBrowser
          hackathons={hackathons}
          bounties={bounties}
          grants={grants}
          programs={programs}
          jobs={jobs}
        />
      </PageShell>
      <BottomCTA />
    </>
  );
}
