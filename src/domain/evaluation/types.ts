import type { ConnectorOpportunityType, NormalizedObservation } from '../connectors/types.ts';

export type PublicationProposal = 'internal' | 'review' | 'provisional' | 'public' | 'suppressed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export type EvaluationContext = {
  sourceTrust: 'official' | 'partner' | 'curated' | 'unreviewed';
  verifiedOrganizerDomains?: string[];
  now?: string;
};

export type EvaluatedField = {
  fieldPath: string;
  value: unknown;
  evidencePresent: boolean;
  confidence: number;
  sourcePath?: string;
};

export type EvaluationResult = {
  observation: NormalizedObservation;
  opportunityType: ConnectorOpportunityType;
  fields: EvaluatedField[];
  sourceConfidence: number;
  organizerConfidence: number;
  fieldCompleteness: number;
  evidenceCompleteness: number;
  duplicateRisk: RiskLevel;
  impersonationRisk: RiskLevel;
  conflictRisk: RiskLevel;
  freshnessRisk: RiskLevel;
  proposedPublicationState: PublicationProposal;
  reasons: string[];
  reviewRequired: boolean;
};

export type ReviewCaseProposal = {
  opportunityId: string | null;
  triggeringObservationId: string;
  reasonCodes: string[];
  priority: number;
  risk: Record<string, RiskLevel>;
  status: 'open';
  proposedChanges: Record<string, unknown>;
};

export type BenchmarkCase = {
  id: string;
  sourceId: string;
  category: ConnectorOpportunityType;
  expectedItemId: string;
  expectedDetected: boolean;
  manuallyReviewed: boolean;
};

export type ShadowMetrics = {
  detected: number;
  expected: number;
  truePositives: number;
  falsePositives: number;
  duplicateCount: number;
  evidenceCompleteCount: number;
  detectionCoverage: number;
  publicationPrecision: number;
  duplicateRate: number;
  evidenceCoverage: number;
  bySource: Record<string, Omit<ShadowMetrics, 'bySource' | 'byCategory'>>;
  byCategory: Record<string, Omit<ShadowMetrics, 'bySource' | 'byCategory'>>;
};

export type ShadowGateResult = {
  passed: boolean;
  failures: string[];
  metrics: ShadowMetrics;
};
