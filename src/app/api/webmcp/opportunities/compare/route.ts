import { NextRequest, NextResponse } from 'next/server';
import { compareOpportunities, loadOpportunityByRefs, parseJsonBody, parseOpportunityType, type OpportunityReference } from '@/lib/webmcp/opportunities';

function parseRefs(body: Record<string, unknown>): OpportunityReference[] {
  const refsInput = Array.isArray(body.opportunities) ? body.opportunities : body.opportunityRefs;
  if (!Array.isArray(refsInput)) return [];

  return refsInput.slice(0, 4).map((item) => {
    if (typeof item === 'string') {
      const [type, ...idParts] = item.split(':');
      const parsedType = parseOpportunityType(type);
      const id = idParts.join(':').trim();
      return parsedType && id ? { type: parsedType, id } : null;
    }
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const record = parseJsonBody(item);
      const type = parseOpportunityType(record.type);
      const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : null;
      return type && id ? { type, id } : null;
    }
    return null;
  }).filter((ref): ref is OpportunityReference => Boolean(ref));
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = parseJsonBody(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const refs = parseRefs(body);
  if (refs.length < 2) {
    return NextResponse.json({ ok: false, error: 'need_2_to_4_opportunity_references' }, { status: 400 });
  }

  const { opportunities, missingRefs, error } = await loadOpportunityByRefs(refs);
  if (error !== null) {
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
  if (missingRefs.length) {
    return NextResponse.json({ ok: false, error: 'opportunity_not_found', missingRefs }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    tool: 'compare_opportunities',
    source: 'supabase:hackathons+jobs+grants+bounties+programs + verified_hackathon_sidecar',
    ...compareOpportunities(opportunities, body),
  });
}
