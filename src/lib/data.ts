import Fuse from "fuse.js";
import { Hackathon, FilterKey, FilterState } from "@/lib/types";
import { isExpired } from "@/lib/utils";
import hackathonsJson from "../../data/hackathons.json";

const raw = hackathonsJson as Hackathon[];

export function getAllHackathons(): Hackathon[] {
  return raw
    .filter((h) => !isExpired(h.submissionDeadline))
    .sort(
      (a, b) =>
        new Date(a.submissionDeadline).getTime() -
        new Date(b.submissionDeadline).getTime()
    );
}

export function filterHackathons(
  hackathons: Hackathon[],
  state: FilterState
): Hackathon[] {
  const { activeFilters, sortBy, searchQuery } = state;

  let results = [...hackathons];

  // Apply search first (Fuse.js fuzzy)
  if (searchQuery.trim()) {
    const fuse = new Fuse(results, {
      keys: ["name", "description"],
      threshold: 0.35,
      ignoreLocation: true,
    });
    results = fuse.search(searchQuery).map((r) => r.item);
  }

  // Apply stackable filters (skip "all")
  const active = activeFilters.filter((f) => f !== "all");
  if (active.length > 0) {
    results = results.filter((h) => {
      return active.every((filter) => matchesFilter(h, filter));
    });
  }

  // Apply sort
  results = sortHackathons(results, sortBy);

  return results;
}

function matchesFilter(h: Hackathon, filter: FilterKey): boolean {
  switch (filter) {
    case "ai":
      return h.category === "AI";
    case "web3":
      return h.category === "Web3";
    case "both":
      return h.category === "Both";
    case "online":
      return h.format === "Online";
    case "offline":
      return h.format === "In-Person";
    case "closing-soon": {
      const days =
        (new Date(h.submissionDeadline).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24);
      return days <= 7;
    }
    case "free":
      return h.isFree === true;
    default:
      return true;
  }
}

function sortHackathons(hackathons: Hackathon[], sortBy: FilterState["sortBy"]): Hackathon[] {
  const sorted = [...hackathons];
  switch (sortBy) {
    case "deadline":
      return sorted.sort(
        (a, b) =>
          new Date(a.submissionDeadline).getTime() -
          new Date(b.submissionDeadline).getTime()
      );
    case "prize":
      return sorted.sort((a, b) => b.prizePool - a.prizePool);
    case "recent":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

export function getFeaturedHackathons(hackathons: Hackathon[]): Hackathon[] {
  return hackathons.filter((h) => h.isFeatured);
}

export function getHackathonBySlug(slug: string): Hackathon | undefined {
  return raw.find((h) => h.slug === slug);
}
