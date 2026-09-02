import { opportunityTypes, type OpportunitySubmission, type OpportunityType, type SubmissionParseResult } from './types.ts';

const categories = ['AI', 'Web3', 'Both'] as const;
const formats = ['Online', 'In-Person', 'Hybrid', 'Remote'] as const;
const yesNo = ['Yes', 'No'] as const;

const limits: Record<string, number> = {
  opportunity_name: 200,
  organizer: 200,
  apply_url: 500,
  description: 500,
  prize_pool: 100,
  your_name: 100,
  your_email: 200,
  telegram_handle: 100,
};

function text(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x08\x0B\x0E-\x1F\x7F]/g, '')
    .trim();
}

function typeOf(value: unknown): OpportunityType | '' {
  const normalized = text(value).toLowerCase();
  if (normalized === 'hackathon' || normalized === 'bounty' || normalized === 'grant' || normalized === 'program' || normalized === 'job') {
    return normalized;
  }
  return '';
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Converts the current client payload and the old hackathon-only payload into
 * one validated submission. It intentionally preserves type-specific fields
 * in `details` so the API cannot silently discard them.
 */
export function parseSubmission(raw: unknown): SubmissionParseResult {
  const input = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const opportunityType = typeOf(input.opportunity_type ?? input.opportunityType);
  const opportunityName = text(input.opportunity_name ?? input.hackathon_name);
  const organizer = text(input.organizer);
  const applyUrl = text(input.apply_url);
  const category = text(input.category) as OpportunitySubmission['category'];
  const format = text(input.format) as OpportunitySubmission['format'];
  const freeToEnter = text(input.free_to_enter) as OpportunitySubmission['freeToEnter'];
  const isOrganizer = text(input.is_organizer) as OpportunitySubmission['isOrganizer'];
  const description = text(input.description);
  const deadline = text(input.deadline);
  const prizePool = text(input.prize_pool);
  const yourName = text(input.your_name);
  const yourEmail = text(input.your_email).toLowerCase();
  const telegramHandle = text(input.telegram_handle);
  const errors: Record<string, string> = {};

  if (!opportunityTypes.includes(opportunityType as OpportunityType)) errors.opportunity_type = 'Invalid opportunity type';
  if (!opportunityName) errors.opportunity_name = 'Required';
  if (!organizer) errors.organizer = 'Required';
  if (!applyUrl) errors.apply_url = 'Required';
  else if (!isHttpsUrl(applyUrl)) errors.apply_url = 'Must be a valid https:// URL';
  if (!categories.includes(category)) errors.category = 'Invalid category';
  if (opportunityType !== 'bounty' && !formats.includes(format as (typeof formats)[number])) errors.format = 'Invalid format';
  if (opportunityType === 'hackathon' && !yesNo.includes(freeToEnter as (typeof yesNo)[number])) errors.free_to_enter = 'Required';
  if (!yesNo.includes(isOrganizer as (typeof yesNo)[number])) errors.is_organizer = 'Required';
  if (!yourName) errors.your_name = 'Required';
  if (!yourEmail) errors.your_email = 'Required';
  else if (!isEmail(yourEmail)) errors.your_email = 'Must be a valid email address';

  for (const [field, limit] of Object.entries(limits)) {
    const value = field === 'opportunity_name' ? opportunityName
      : field === 'organizer' ? organizer
      : field === 'apply_url' ? applyUrl
      : field === 'description' ? description
      : field === 'prize_pool' ? prizePool
      : field === 'your_name' ? yourName
      : field === 'your_email' ? yourEmail
      : telegramHandle;
    if (value.length > limit) errors[field] = `Max ${limit} characters`;
  }

  const details = {
    reward: text(input.reward),
    platform: text(input.platform),
    amount: text(input.amount),
    ecosystem: text(input.ecosystem),
    stipend: text(input.stipend),
    duration: text(input.duration),
    programType: text(input.program_type ?? input.programType),
    salary: text(input.salary),
    location: text(input.location),
  };

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      opportunityType: opportunityType as OpportunityType,
      opportunityName,
      organizer,
      applyUrl,
      category,
      description,
      deadline,
      prizePool,
      format,
      freeToEnter,
      isOrganizer,
      yourName,
      yourEmail,
      telegramHandle,
      details,
    },
  };
}
