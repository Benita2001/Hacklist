export const revalidate = 300; // rebuild from Supabase at most every 5 minutes

import { getHackathons } from '@/lib/data';
import { PageShell } from '@/components/layout/PageShell';
import { HeroSection } from '@/components/home/HeroSection';
import { HackathonBrowser } from '@/components/home/HackathonBrowser';
import { BottomCTA } from '@/components/home/BottomCTA';

export default async function HomePage() {
  const hackathons = await getHackathons();

  return (
    <>
      <PageShell>
        <HeroSection hackathons={hackathons} />
        <HackathonBrowser hackathons={hackathons} />
      </PageShell>
      <BottomCTA />
    </>
  );
}
