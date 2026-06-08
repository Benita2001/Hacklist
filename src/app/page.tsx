export const revalidate = 300; // rebuild from Supabase at most every 5 minutes

import { getHackathons } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { PageShell } from '@/components/layout/PageShell';
import { HeroSection } from '@/components/home/HeroSection';
import { TabBrowser, type Bounty, type Grant, type Program, type Job } from '@/components/home/TabBrowser';
import { BottomCTA } from '@/components/home/BottomCTA';

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
  return (data ?? []) as Job[];
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
      <PageShell>
        <HeroSection />
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
