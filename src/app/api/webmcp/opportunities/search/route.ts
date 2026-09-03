import { NextRequest, NextResponse } from 'next/server';
import { getPacificDate, loadActiveOpportunities, parseJsonBody, searchOpportunities } from '@/lib/webmcp/opportunities';

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

  const result = searchOpportunities(opportunities, body);

  return NextResponse.json({
    ok: true,
    tool: 'search_opportunities',
    source: 'supabase:hackathons+jobs+grants+bounties+programs',
    generatedAt: new Date().toISOString(),
    filters: {
      activeOnOrAfter: today,
      query: result.query,
      type: result.type,
      category: result.category,
      format: result.format,
      verifiedOnly: result.verifiedOnly,
      limit: result.limit,
    },
    count: result.opportunities.length,
    opportunities: result.opportunities,
  });
}
