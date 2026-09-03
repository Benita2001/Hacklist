import { NextRequest, NextResponse } from 'next/server';
import { loadOpportunityByRefs, parseJsonBody, parseOpportunityRef, opportunityRef } from '@/lib/webmcp/opportunities';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = parseJsonBody(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const ref = parseOpportunityRef(body);
  if (!ref) {
    return NextResponse.json({ ok: false, error: 'missing_opportunity_reference' }, { status: 400 });
  }

  const { opportunities, missingRefs, error } = await loadOpportunityByRefs([ref]);
  if (error !== null) {
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
  if (!opportunities.length) {
    return NextResponse.json({ ok: false, error: 'opportunity_not_found', missingRefs }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    tool: 'get_opportunity',
    generatedAt: new Date().toISOString(),
    opportunityRef: opportunityRef(ref.type, ref.id),
    opportunity: opportunities[0],
  });
}
