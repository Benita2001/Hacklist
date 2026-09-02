import type { NormalizedObservation } from '../connectors/types.ts';
import { classifyObservation } from './classify.ts';
import type { EvaluationContext, EvaluationResult, EvaluatedField, ReviewCaseProposal, RiskLevel } from './types.ts';

const publicFieldPaths = ['title', 'organizer', 'applicationUrl', 'deadline', 'description'];

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sourceConfidence(context: EvaluationContext): number {
  return context.sourceTrust === 'official' ? 1 : context.sourceTrust === 'partner' ? 0.85 : context.sourceTrust === 'curated' ? 0.7 : 0.4;
}

function domainOf(value: string): string {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}

function organizerEvaluation(observation: NormalizedObservation, context: EvaluationContext): { confidence: number; risk: RiskLevel; reasons: string[] } {
  const organizer = text(observation.normalizedPayload.organizer);
  const sourceDomain = domainOf(observation.canonicalSourceUrl);
  const verifiedDomains = new Set((context.verifiedOrganizerDomains ?? []).map((domain) => domain.toLowerCase().replace(/^www\./, '')));
  if (!organizer) return { confidence: 0, risk: 'unknown', reasons: ['organizer_missing'] };
  if (verifiedDomains.has(sourceDomain)) return { confidence: 1, risk: 'low', reasons: ['organizer_domain_verified'] };
  if (context.sourceTrust === 'official') return { confidence: 0.75, risk: 'medium', reasons: ['organizer_present_official_source'] };
  return { confidence: 0.45, risk: 'unknown', reasons: ['organizer_requires_resolution'] };
}

function freshnessRisk(observation: NormalizedObservation, context: EvaluationContext): RiskLevel {
  const observedAt = Date.parse(observation.observedAt);
  const now = Date.parse(context.now ?? new Date().toISOString());
  if (!Number.isFinite(observedAt) || !Number.isFinite(now)) return 'unknown';
  const ageDays = (now - observedAt) / 86_400_000;
  return ageDays <= 7 ? 'low' : ageDays <= 30 ? 'medium' : 'high';
}

function fieldsFor(observation: NormalizedObservation): EvaluatedField[] {
  const evidenceByPath = new Map(observation.evidence.map((entry) => [entry.fieldPath, entry]));
  return publicFieldPaths.map((fieldPath) => {
    const value = observation.normalizedPayload[fieldPath];
    const evidence = evidenceByPath.get(fieldPath);
    return {
      fieldPath,
      value,
      evidencePresent: Boolean(evidence),
      confidence: evidence ? 1 : 0,
      sourcePath: evidence?.sourcePath,
    };
  });
}

export function evaluateObservation(observation: NormalizedObservation, context: EvaluationContext): EvaluationResult {
  const classification = classifyObservation(observation);
  const fields = fieldsFor(observation);
  const organizer = organizerEvaluation(observation, context);
  const fieldCompleteness = fields.filter((field) => field.value !== undefined && field.value !== null && field.value !== '').length / fields.length;
  const evidenceCompleteness = fields.filter((field) => field.evidencePresent).length / fields.length;
  const reasons = [...classification.reasons, ...organizer.reasons];
  if (classification.type === 'unknown') reasons.push('manual_category_review_required');
  if (evidenceCompleteness < 1) reasons.push('field_evidence_incomplete');
  if (fieldCompleteness < 0.6) reasons.push('field_completeness_low');
  if (observation.normalizedPayload.applicationUrl === undefined) reasons.push('application_url_missing');
  const reviewRequired = reasons.some((reason) => reason.includes('required') || reason.includes('missing') || reason.includes('incomplete') || reason.includes('low') || reason.includes('resolution')) || organizer.risk !== 'low';
  const proposedPublicationState = !reviewRequired && organizer.confidence >= 0.9 && evidenceCompleteness === 1 && context.sourceTrust === 'official'
    ? 'provisional'
    : 'review';
  return {
    observation,
    opportunityType: classification.type,
    fields,
    sourceConfidence: sourceConfidence(context),
    organizerConfidence: organizer.confidence,
    fieldCompleteness,
    evidenceCompleteness,
    duplicateRisk: 'unknown',
    impersonationRisk: organizer.risk,
    conflictRisk: 'unknown',
    freshnessRisk: freshnessRisk(observation, context),
    proposedPublicationState,
    reasons,
    reviewRequired,
  };
}

export function toReviewCase(result: EvaluationResult, opportunityId: string | null = null): ReviewCaseProposal | null {
  if (!result.reviewRequired) return null;
  const reasonCodes = [...new Set(result.reasons)];
  return {
    opportunityId,
    triggeringObservationId: result.observation.sourceItemId,
    reasonCodes,
    priority: result.impersonationRisk === 'high' ? 1000 : result.opportunityType === 'unknown' ? 800 : 500,
    risk: {
      source: result.sourceConfidence >= 0.8 ? 'low' : result.sourceConfidence >= 0.5 ? 'medium' : 'high',
      organizer: result.impersonationRisk,
      duplicate: result.duplicateRisk,
      conflict: result.conflictRisk,
      freshness: result.freshnessRisk,
    },
    status: 'open',
    proposedChanges: Object.fromEntries(result.fields.map((field) => [field.fieldPath, field.value])),
  };
}
