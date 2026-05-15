export const siteConfig = {
  name: "HackList",
  tagline: "Prize-first. Deadline-sorted. Builder-focused.",
  description: "The best place on the internet to find active AI and Web3 hackathons, sorted by deadline, led by prize intelligence.",
  url: "https://hacklist.io",
  tallyFormUrl: "https://tally.so/r/XXXXXXX",
  social: {
    twitter: "https://twitter.com/0xbeni",
  },
} as const;

export type SiteConfig = typeof siteConfig;
