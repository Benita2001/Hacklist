export interface Hackathon {
  id: string;
  name: string;
  organizer: string;
  description: string | null;
  prize_pool: string | null;
  deadline: string | null;        // YYYY-MM-DD or null
  deadline_text: string | null;   // "TBD", "Rolling", etc.
  category: 'AI' | 'Web3' | 'Both';
  format: 'Online' | 'In-Person' | 'Hybrid';
  free_to_enter: boolean;
  apply_url: string | null;
  spotlight: boolean;
  verified: boolean;
  created_at: string;
}

export type FilterKey = 'ai' | 'web3' | 'online' | 'offline' | 'closing-soon' | 'free';
export type SortKey   = 'deadline' | 'prize' | 'recent';

export interface FilterState {
  activeFilters: FilterKey[];
  sortBy: SortKey;
  searchQuery: string;
}
