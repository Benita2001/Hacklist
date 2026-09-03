'use client';

import { useEffect } from 'react';

type OpportunityType = 'hackathon' | 'job' | 'grant' | 'bounty' | 'program';

type SearchOpportunitiesInput = {
  query?: string;
  type?: OpportunityType;
  category?: 'AI' | 'Web3' | 'Both';
  format?: string;
  verifiedOnly?: boolean;
  limit?: number;
};

type OpportunityReferenceInput = {
  type: OpportunityType;
  id: string;
};

type GetOpportunityInput = OpportunityReferenceInput | {
  opportunityRef: string;
};

type MatchOpportunitiesInput = {
  type?: OpportunityType;
  opportunityTypes?: OpportunityType[];
  country?: string;
  skills?: string[];
  technologies?: string[];
  interests?: string[];
  availableDays?: number;
  preferredFormats?: Array<'Online' | 'In-Person' | 'Hybrid' | 'Remote' | 'Any'>;
  avoid?: string[];
  teamSize?: number;
  solo?: boolean;
  minimumValue?: number;
  hasExistingProject?: boolean;
  limit?: number;
};

type CompareOpportunitiesInput = {
  opportunities: OpportunityReferenceInput[];
  profile?: MatchOpportunitiesInput;
};

const sharedAnnotations = {
  readOnlyHint: true,
  untrustedContentHint: true,
};

const opportunityTypeSchema = {
  type: 'string',
  enum: ['hackathon', 'job', 'grant', 'bounty', 'program'],
  description: 'Optional HackList opportunity type filter.',
};

const opportunityReferenceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'id'],
  properties: {
    type: opportunityTypeSchema,
    id: { type: 'string', minLength: 1, maxLength: 100, description: 'Stable ID from the source HackList table.' },
  },
};

const profileSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: opportunityTypeSchema,
    opportunityTypes: { type: 'array', maxItems: 5, items: opportunityTypeSchema, description: 'Allowed opportunity types when matching across the catalog.' },
    country: { type: 'string', maxLength: 80, description: 'Builder country, territory, or jurisdiction.' },
    skills: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 60 }, description: 'Builder skills, frameworks, APIs, or domain strengths.' },
    technologies: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 60 }, description: 'Technologies the builder wants or is able to use.' },
    interests: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 80 }, description: 'Opportunity themes or domains the builder prefers.' },
    availableDays: { type: 'integer', minimum: 0, maximum: 120, description: 'Whole days available before deadline.' },
    preferredFormats: { type: 'array', maxItems: 5, items: { type: 'string', enum: ['Online', 'In-Person', 'Hybrid', 'Remote', 'Any'] }, description: 'Acceptable participation or work formats.' },
    avoid: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 80 }, description: 'Technologies, themes, requirements, or terms to avoid.' },
    teamSize: { type: 'integer', minimum: 1, maximum: 99, description: 'Expected team size when relevant.' },
    solo: { type: 'boolean', description: 'Whether the builder is acting alone.' },
    minimumValue: { type: 'integer', minimum: 0, description: 'Minimum known dollar-denominated value when relevant.' },
    hasExistingProject: { type: 'boolean', description: 'Whether the builder wants to submit or extend existing work.' },
    limit: { type: 'integer', minimum: 1, maximum: 20, description: 'Maximum matches to return.' },
  },
};

function publishToolResult(endpoint: string, ok: boolean, payload: unknown) {
  window.dispatchEvent(new CustomEvent('hacklist:webmcp-tool-result', {
    detail: {
      endpoint,
      ok,
      payload,
      occurredAt: new Date().toISOString(),
    },
  }));
}

async function postTool(endpoint: string, input: unknown, signal?: AbortSignal) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input ?? {}),
    signal,
  });

  const payload = await response.json();

  if (!response.ok) {
    const errorPayload = {
      ok: false,
      error: payload?.error ?? 'webmcp_tool_failed',
      missingRefs: payload?.missingRefs,
    };
    publishToolResult(endpoint, false, errorPayload);
    return errorPayload;
  }

  publishToolResult(endpoint, true, payload);
  return payload;
}

export function WebMcpRegistrar() {
  useEffect(() => {
    window.__hacklistWebMcpRegistrar = { mounted: true, registered: false };
    const controller = new AbortController();
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const registerTools = () => {
      if (!document.modelContext?.registerTool) {
        if (retryCount < 20) {
          retryCount += 1;
          retryTimer = setTimeout(registerTools, 100);
        }
        return;
      }

      const registrations = [
        document.modelContext.registerTool<SearchOpportunitiesInput>({
          name: 'search_opportunities',
          title: 'Search HackList Opportunities',
          description: 'Search active HackList opportunities across hackathons, jobs, grants, bounties, and programs using real Supabase data.',
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              query: { type: 'string', description: 'Optional search text for title, organization, description, category, value, location, or format.', maxLength: 120 },
              type: opportunityTypeSchema,
              category: { type: 'string', enum: ['AI', 'Web3', 'Both'], description: 'Optional AI/Web3/Both category filter.' },
              format: { type: 'string', maxLength: 80, description: 'Optional format/location filter such as Online, Remote, Hybrid, or In-Person.' },
              verifiedOnly: { type: 'boolean', description: 'When true, return only HackList-verified listings.' },
              limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Maximum number of opportunities to return.' },
            },
          },
          annotations: sharedAnnotations,
          execute: async (input, options) => postTool('/api/webmcp/opportunities/search', input, options?.signal),
        }, { signal: controller.signal }),
        document.modelContext.registerTool<GetOpportunityInput>({
          name: 'get_opportunity',
          title: 'Get HackList Opportunity',
          description: 'Return one HackList opportunity by typed reference with normalized fields, original category metadata, and verified intelligence when available.',
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: opportunityTypeSchema,
              id: { type: 'string', minLength: 1, maxLength: 100, description: 'Stable ID from the source HackList table.' },
              opportunityRef: { type: 'string', minLength: 3, maxLength: 140, description: 'Alternative compound reference in the form type:id.' },
            },
          },
          annotations: sharedAnnotations,
          execute: async (input, options) => postTool('/api/webmcp/opportunities/get', input, options?.signal),
        }, { signal: controller.signal }),
        document.modelContext.registerTool<MatchOpportunitiesInput>({
          name: 'match_opportunities',
          title: 'Match HackList Opportunities',
          description: 'Rank active HackList opportunities for a builder profile using category-aware evidence, hard constraints, and UNKNOWN-preserving reasoning.',
          inputSchema: profileSchema,
          annotations: sharedAnnotations,
          execute: async (input, options) => postTool('/api/webmcp/opportunities/match', input, options?.signal),
        }, { signal: controller.signal }),
        document.modelContext.registerTool<CompareOpportunitiesInput>({
          name: 'compare_opportunities',
          title: 'Compare HackList Opportunities',
          description: 'Compare 2 to 4 typed HackList opportunity references, preserving category-specific value types and labeling non-comparable dimensions.',
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            required: ['opportunities'],
            properties: {
              opportunities: {
                type: 'array',
                minItems: 2,
                maxItems: 4,
                items: opportunityReferenceSchema,
                description: 'Typed opportunity references to compare.',
              },
              profile: {
                ...profileSchema,
                description: 'Optional builder profile to make the comparison decision-specific.',
              },
            },
          },
          annotations: sharedAnnotations,
          execute: async (input, options) => postTool('/api/webmcp/opportunities/compare', input, options?.signal),
        }, { signal: controller.signal }),
        document.modelContext.registerTool<GetOpportunityInput>({
          name: 'get_opportunity_readiness',
          title: 'Get Opportunity Readiness',
          description: 'Return a category-aware readiness checklist for one HackList opportunity, separating known listing facts from UNKNOWN requirements.',
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: opportunityTypeSchema,
              id: { type: 'string', minLength: 1, maxLength: 100, description: 'Stable ID from the source HackList table.' },
              opportunityRef: { type: 'string', minLength: 3, maxLength: 140, description: 'Alternative compound reference in the form type:id.' },
            },
          },
          annotations: sharedAnnotations,
          execute: async (input, options) => postTool('/api/webmcp/opportunities/readiness', input, options?.signal),
        }, { signal: controller.signal }),
      ];

      Promise.all(registrations).catch((error) => {
        console.warn('[webmcp] HackList opportunity tool registration failed', error);
      }).then(() => {
        window.__hacklistWebMcpRegistrar = { mounted: true, registered: true };
      });
    };

    registerTools();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      controller.abort();
    };
  }, []);

  return <span hidden data-webmcp-registrar="hacklist" />;
}
