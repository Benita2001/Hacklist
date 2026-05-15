import Fuse from 'fuse.js';
import { supabase } from './supabase';
import { Hackathon, FilterKey, FilterState, SortKey } from './types';
import { parsePrizeToNumber } from './utils';

export async function getHackathons(): Promise<Hackathon[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('hackathons')
    .select('*')
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) {
    console.error('Supabase error:', error);
    return [];
  }
  return (data ?? []) as Hackathon[];
}

export function filterHackathons(hackathons: Hackathon[], state: FilterState): Hackathon[] {
  const { activeFilters, sortBy, searchQuery } = state;
  let results = [...hackathons];

  if (searchQuery.trim()) {
    const fuse = new Fuse(results, {
      keys: ['name', 'description'],
      threshold: 0.35,
      ignoreLocation: true,
    });
    results = fuse.search(searchQuery).map(r => r.item);
  }

  if (activeFilters.length > 0) {
    const categoryFilters = activeFilters.filter(f => f === 'ai' || f === 'web3');
    const formatFilters   = activeFilters.filter(f => f === 'online' || f === 'offline');
    const attrFilters     = activeFilters.filter(f => f === 'closing-soon' || f === 'free');
    results = results.filter(h =>
      (categoryFilters.length === 0 || categoryFilters.some(f => matchesFilter(h, f))) &&
      (formatFilters.length   === 0 || formatFilters.some(f => matchesFilter(h, f)))   &&
      attrFilters.every(f => matchesFilter(h, f))
    );
  }

  return sortHackathons(results, sortBy);
}

function matchesFilter(h: Hackathon, filter: FilterKey): boolean {
  switch (filter) {
    case 'ai':      return h.category === 'AI';
    case 'web3':    return h.category === 'Web3';
    case 'online':  return h.format === 'Online';
    case 'offline': return h.format === 'In-Person';
    case 'closing-soon': {
      if (!h.deadline) return false;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const d = new Date(h.deadline); d.setHours(0, 0, 0, 0);
      const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    }
    case 'free':    return h.free_to_enter === true;
    default:        return true;
  }
}

function sortHackathons(hackathons: Hackathon[], sortBy: SortKey): Hackathon[] {
  const sorted = [...hackathons];
  switch (sortBy) {
    case 'deadline':
      return sorted.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    case 'prize':
      return sorted.sort((a, b) => parsePrizeToNumber(b.prize_pool) - parsePrizeToNumber(a.prize_pool));
    case 'recent':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}
