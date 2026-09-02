import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSubmission } from '../src/domain/opportunities/schemas.ts';

function payload(type: string): Record<string, unknown> {
  return {
    opportunity_type: type,
    opportunity_name: `${type} opportunity`,
    organizer: 'HackList test organizer',
    apply_url: 'https://example.com/apply',
    category: 'AI',
    description: 'A valid test opportunity.',
    deadline: '2026-12-31',
    prize_pool: '$10,000',
    format: 'Online',
    free_to_enter: 'Yes',
    is_organizer: 'Yes',
    your_name: 'Test Owner',
    your_email: 'owner@example.com',
    telegram_handle: '@hacklist',
    reward: '$1,000',
    platform: 'Gitcoin',
    amount: '$5,000',
    ecosystem: 'Base',
    stipend: '$2,000',
    duration: '12 weeks',
    program_type: 'Fellowship',
    salary: '$120,000',
    location: 'Remote',
  };
}

test('accepts all five opportunity types through one contract', () => {
  for (const type of ['hackathon', 'bounty', 'grant', 'program', 'job']) {
    const result = parseSubmission(payload(type));
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.opportunityType, type);
      assert.equal(result.data.details.reward, '$1,000');
      assert.equal(result.data.details.salary, '$120,000');
    }
  }
});

test('accepts the legacy hackathon_name field while normalizing the type', () => {
  const legacy = payload('Hackathon');
  delete legacy.opportunity_name;
  legacy.hackathon_name = 'Legacy Hackathon';
  const result = parseSubmission(legacy);
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.opportunityName, 'Legacy Hackathon');
});

test('rejects unsafe URLs and incomplete requests without creating a record', () => {
  const result = parseSubmission({ opportunity_type: 'job', opportunity_name: 'Bad', apply_url: 'http://example.com' });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errors.apply_url, 'Must be a valid https:// URL');
    assert.equal(result.errors.organizer, 'Required');
  }
});
