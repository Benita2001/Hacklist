export const opportunityTypes = ['hackathon', 'bounty', 'grant', 'program', 'job'] as const;
export type OpportunityType = (typeof opportunityTypes)[number];

export type SubmissionDetails = {
  reward?: string;
  platform?: string;
  amount?: string;
  ecosystem?: string;
  stipend?: string;
  duration?: string;
  programType?: string;
  salary?: string;
  location?: string;
};

export type OpportunitySubmission = {
  opportunityType: OpportunityType;
  opportunityName: string;
  organizer: string;
  applyUrl: string;
  category: 'AI' | 'Web3' | 'Both';
  description: string;
  deadline: string;
  prizePool: string;
  format: 'Online' | 'In-Person' | 'Hybrid' | 'Remote' | '';
  freeToEnter: 'Yes' | 'No' | '';
  isOrganizer: 'Yes' | 'No' | '';
  yourName: string;
  yourEmail: string;
  telegramHandle: string;
  details: SubmissionDetails;
};

export type SubmissionParseResult =
  | { success: true; data: OpportunitySubmission }
  | { success: false; errors: Record<string, string> };
