import type { OpportunitySubmission } from './types.ts';

/**
 * Keeps the existing listing_requests columns compatible while the canonical
 * migration adds opportunity_type and details. The details JSON is the only
 * place type-specific values are stored, so no field is dropped.
 */
export function toListingRequestRow(input: OpportunitySubmission): Record<string, unknown> {
  return {
    hackathon_name: input.opportunityName,
    opportunity_type: input.opportunityType,
    organizer: input.organizer,
    prize_pool: input.prizePool || null,
    deadline: input.deadline || null,
    apply_url: input.applyUrl,
    category: input.category,
    format: input.format || null,
    free_to_enter: input.freeToEnter === 'Yes',
    is_organizer: input.isOrganizer === 'Yes',
    description: input.description || null,
    your_name: input.yourName,
    your_email: input.yourEmail,
    telegram_handle: input.telegramHandle || null,
    details: input.details,
  };
}
