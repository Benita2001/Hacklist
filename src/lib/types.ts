export interface PrizeBreakdown {
  place: string;
  amount: string;
}

export interface JudgingCriterion {
  name: string;
  weight: number;
  description: string;
}

export interface Hackathon {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;

  startDate: string;
  endDate: string;
  submissionDeadline: string;
  timezone: string;

  prizePool: number;
  prizeDisplay: string;
  prizeBreakdown: PrizeBreakdown[];

  category: "AI" | "Web3" | "Both" | "Other";
  format: "Online" | "In-Person" | "Hybrid";
  tags: string[];

  organizer: string;
  applyUrl: string;
  sourceUrl: string;
  sourcePlatform: "devpost" | "dorahacks" | "lablab" | "gitcoin" | "other";

  isFree: boolean;
  isOpen: boolean;
  eligibility: string;
  teamSize: string;

  isVerified: boolean;
  isFeatured: boolean;
  isSpotlight: boolean;

  judgingCriteria: JudgingCriterion[];

  createdAt: string;
  updatedAt: string;
  dataSource: "manual" | "hermes";
  hermesConfidence: number | null;
}

export type FilterKey =
  | "all"
  | "ai"
  | "web3"
  | "both"
  | "online"
  | "offline"
  | "closing-soon"
  | "free";

export type SortKey = "deadline" | "prize" | "recent";

export interface FilterState {
  activeFilters: FilterKey[];
  sortBy: SortKey;
  searchQuery: string;
}
