import type { OpportunitySubmission, OpportunityType } from '../opportunities/types.ts';

export type ConnectorOpportunityType = OpportunityType | 'unknown';

export type ConnectorWarning = {
  code: string;
  message: string;
  itemId?: string;
};

export type ConnectorMetrics = {
  requests: number;
  bytes: number;
  changed: boolean;
  skippedUnchanged: boolean;
  observations: number;
  durationMs: number;
  costUnits: number;
};

export type ObservationEvidence = {
  fieldPath: string;
  observedValue: unknown;
  sourcePath?: string;
  capturedTextSpan?: string;
  extractionMethod: 'submitted' | 'structured_data' | 'parser';
};

export type NormalizedObservation = {
  sourceId: string;
  sourceItemId: string;
  canonicalSourceUrl: string;
  observedAt: string;
  contentHash: string;
  parserVersion: string;
  opportunityType: ConnectorOpportunityType;
  normalizedPayload: Record<string, unknown>;
  evidence: ObservationEvidence[];
  httpMetadata: Record<string, string>;
};

export type DocumentRequest = {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
};

export type DocumentResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

export type DocumentFetcher = (request: DocumentRequest, timeoutMs: number, maxBytes: number) => Promise<DocumentResponse>;

export type ConnectorContext = {
  sourceId: string;
  sourceUrl: string;
  now?: string;
  previous?: {
    cursor?: string;
    etag?: string;
    lastModified?: string;
    contentHash?: string;
  };
  timeoutMs?: number;
  maxResponseBytes?: number;
  parserVersion?: string;
  fetcher?: DocumentFetcher;
};

export type ConnectorResult = {
  observations: NormalizedObservation[];
  nextCursor?: string;
  sourceContentHash?: string;
  etag?: string;
  lastModified?: string;
  metrics: ConnectorMetrics;
  warnings: ConnectorWarning[];
};

export interface OpportunityConnector {
  readonly id: string;
  discover(context: ConnectorContext): Promise<ConnectorResult>;
}

export type SubmissionConnectorInput = {
  sourceId: string;
  submissions: OpportunitySubmission[];
};
