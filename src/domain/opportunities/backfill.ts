import type { OpportunityType } from './types.ts';

export type LegacyBackfillInput = {
  type: OpportunityType;
  rows: Array<Record<string, unknown>>;
};

export type BackfillDryRunReport = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateKeys: string[];
  unmappedFields: string[];
  byType: Record<OpportunityType, number>;
  warnings: string[];
};

const knownFields = new Set([
  'id', 'name', 'title', 'organizer', 'description', 'apply_url', 'deadline',
  'prize_pool', 'category', 'format', 'free_to_enter', 'verified', 'created_at',
]);

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function rowKey(type: OpportunityType, row: Record<string, unknown>, index: number): string {
  const identity = text(row.id) || text(row.apply_url) || `${text(row.name) || text(row.title)}:${index}`;
  return `${type}:${identity.toLowerCase()}`;
}

/**
 * Read-only reconciliation report. It never inserts, updates, deletes, or
 * calls a provider, so it is safe to run against exported legacy JSON.
 */
export function inspectLegacyBackfill(inputs: LegacyBackfillInput[]): BackfillDryRunReport {
  const report: BackfillDryRunReport = {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    duplicateKeys: [],
    unmappedFields: [],
    byType: { hackathon: 0, bounty: 0, grant: 0, program: 0, job: 0 },
    warnings: [],
  };
  const seen = new Set<string>();
  const unknown = new Set<string>();

  for (const input of inputs) {
    report.byType[input.type] += input.rows.length;
    for (const [index, row] of input.rows.entries()) {
      report.totalRows += 1;
      const key = rowKey(input.type, row, index);
      if (seen.has(key)) report.duplicateKeys.push(key);
      seen.add(key);

      for (const field of Object.keys(row)) if (!knownFields.has(field)) unknown.add(field);

      const hasTitle = Boolean(text(row.name) || text(row.title));
      const hasId = Boolean(text(row.id));
      if (hasTitle && hasId) report.validRows += 1;
      else report.invalidRows += 1;
      if (row.verified === true && !text(row.organizer)) {
        report.warnings.push(`${key}: verified row has no organizer identity`);
      }
    }
  }

  report.unmappedFields = [...unknown].sort();
  if (report.duplicateKeys.length > 0) report.warnings.push('Duplicate identities require review before backfill.');
  if (report.invalidRows > 0) report.warnings.push('Invalid rows remain legacy-only until reconciled.');
  return report;
}
