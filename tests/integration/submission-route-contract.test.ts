import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSubmission } from '../../src/domain/opportunities/schemas.ts';
import { toListingRequestRow } from '../../src/domain/opportunities/legacy-mapper.ts';

test('canonical submission mapping retains type-specific details', () => {
  const parsed = parseSubmission({
    opportunity_type: 'grant',
    opportunity_name: 'Research grant',
    organizer: 'Foundation',
    apply_url: 'https://example.com/grant',
    category: 'AI',
    format: 'Online',
    free_to_enter: 'Yes',
    is_organizer: 'Yes',
    your_name: 'Reviewer',
    your_email: 'reviewer@example.com',
    amount: '$25,000',
    ecosystem: 'Open source',
  });
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  const row = toListingRequestRow(parsed.data);
  assert.equal(row.opportunity_type, 'grant');
  assert.deepEqual(row.details, { reward: '', platform: '', amount: '$25,000', ecosystem: 'Open source', stipend: '', duration: '', programType: '', salary: '', location: '' });
});
