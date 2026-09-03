import { NextRequest, NextResponse } from 'next/server';
import { getPacificDate, loadActiveOpportunities, matchOpportunities, parseJsonBody } from '@/lib/webmcp/opportunities';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = parseJsonBody(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const today = getPacificDate();
  const { opportunities, error } = await loadActiveOpportunities(today);
  if (error !== null) {
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    tool: 'match_opportunities',
    source: 'supabase:hackathons+jobs+grants+bounties+programs + verified_hackathon_sidecar',
    activeOnOrAfter: today,
    ...matchOpportunities(opportunities, body),
  });
}
