'use client';

import { useEffect, useMemo, useState } from 'react';

type ToolEvent = {
  endpoint: string;
  ok: boolean;
  payload: unknown;
  occurredAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function toolName(endpoint: string): string {
  if (endpoint.endsWith('/search')) return 'search_opportunities';
  if (endpoint.endsWith('/get')) return 'get_opportunity';
  if (endpoint.endsWith('/match')) return 'match_opportunities';
  if (endpoint.endsWith('/compare')) return 'compare_opportunities';
  if (endpoint.endsWith('/readiness')) return 'get_opportunity_readiness';
  return 'WebMCP tool';
}

function summarize(event: ToolEvent): { title: string; detail: string; meta: string[] } {
  if (!event.ok) {
    const payload = isRecord(event.payload) ? event.payload : {};
    return {
      title: 'Tool needs attention',
      detail: String(payload.error ?? 'The WebMCP request did not complete.'),
      meta: Array.isArray(payload.missingRefs) ? [`Missing refs: ${payload.missingRefs.join(', ')}`] : [],
    };
  }

  const payload = isRecord(event.payload) ? event.payload : {};

  if (event.endpoint.endsWith('/search')) {
    const opportunities = Array.isArray(payload.opportunities) ? payload.opportunities : [];
    return {
      title: 'Agent searched HackList',
      detail: `${opportunities.length} active opportunit${opportunities.length === 1 ? 'y' : 'ies'} returned.`,
      meta: [payload.query ? `Query: ${String(payload.query)}` : 'Full active catalog'],
    };
  }

  if (event.endpoint.endsWith('/get')) {
    const opportunity = isRecord(payload.opportunity) ? payload.opportunity : {};
    return {
      title: 'Agent opened an opportunity',
      detail: String(opportunity.title ?? 'Opportunity details loaded.'),
      meta: [String(opportunity.organization ?? 'Organization unknown')],
    };
  }

  if (event.endpoint.endsWith('/match')) {
    const matches = Array.isArray(payload.matches) ? payload.matches : [];
    const first = isRecord(matches[0]) ? matches[0] : {};
    return {
      title: 'Agent matched opportunities',
      detail: first.title ? `${String(first.title)}: ${String(first.fit ?? 'fit unknown')}` : 'No matches returned.',
      meta: [
        first.type ? `Type: ${String(first.type)}` : '',
        first.confidence ? `Data: ${String(first.confidence)}` : `${matches.length} match${matches.length === 1 ? '' : 'es'}`,
        first.score !== undefined ? `Score: ${String(first.score)}` : '',
      ].filter(Boolean),
    };
  }

  if (event.endpoint.endsWith('/compare')) {
    const recommendation = isRecord(payload.recommendation) ? payload.recommendation : {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    return {
      title: 'Agent compared opportunities',
      detail: recommendation.opportunityRef ? String(recommendation.reason ?? 'A strong fit was found.') : 'No compared opportunity earned STRONG_FIT.',
      meta: [`Compared: ${items.length}`, payload.comparability ? String(payload.comparability) : ''],
    };
  }

  if (event.endpoint.endsWith('/readiness')) {
    const readiness = isRecord(payload.readiness) ? payload.readiness : {};
    const nestedHackathonReadiness = isRecord(readiness.readiness) ? readiness.readiness : null;
    const known = Array.isArray(readiness.known) ? readiness.known : Array.isArray(nestedHackathonReadiness?.known) ? nestedHackathonReadiness.known : [];
    const unknown = Array.isArray(readiness.unknown) ? readiness.unknown : Array.isArray(nestedHackathonReadiness?.unknown) ? nestedHackathonReadiness.unknown : [];
    return {
      title: 'Agent checked readiness',
      detail: `${String(readiness.opportunityRef ?? nestedHackathonReadiness?.name ?? 'Opportunity')}: ${String(readiness.readiness_status ?? nestedHackathonReadiness?.readiness_status ?? 'UNKNOWN')}`,
      meta: [readiness.type ? `Type: ${String(readiness.type)}` : '', `Known: ${known.length}`, `Unknown: ${unknown.length}`].filter(Boolean),
    };
  }

  return {
    title: 'Agent used HackList',
    detail: 'A WebMCP tool completed.',
    meta: [],
  };
}

export function WebMcpAgentState() {
  const [event, setEvent] = useState<ToolEvent | null>(null);

  useEffect(() => {
    const onToolResult = (browserEvent: Event) => {
      const detail = (browserEvent as CustomEvent<ToolEvent>).detail;
      if (detail) setEvent(detail);
    };

    window.addEventListener('hacklist:webmcp-tool-result', onToolResult);
    return () => window.removeEventListener('hacklist:webmcp-tool-result', onToolResult);
  }, []);

  const summary = useMemo(() => event ? summarize(event) : null, [event]);
  if (!event || !summary) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8" aria-live="polite">
      <div className="border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {toolName(event.endpoint)}
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-950">{summary.title}</h2>
            <p className="mt-1 text-sm text-slate-700">{summary.detail}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            {summary.meta.map((item) => (
              <span key={item} className="border border-slate-200 bg-slate-50 px-2 py-1">
                {item}
              </span>
            ))}
            <span className="border border-slate-200 bg-slate-50 px-2 py-1">
              {event.ok ? 'OK' : 'Error'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
