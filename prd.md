# HackList — Product Requirements Document

> **Version:** 1.0  
> **Status:** Approved — ready for Claude Code implementation  
> **Last updated:** 2026-05-06  
> **Owner:** BigBeni (@0xbeni)

---

## 1. Product Vision

**HackList** is the best place on the internet to find active AI and Web3 hackathons — sorted by deadline, led by prize intelligence.

We are not a platform. We do not host hackathons. We are an aggregator — Google Flights for hackathons. Every Apply button links directly to the original hackathon page on DoraHacks, Devpost, Lablab, or wherever it lives.

**The gap we fill:** Devpost, DoraHacks, and Lablab.ai are all organizer tools. HackList is purely a builder discovery tool. Clean. Fast. Prize-first. Deadline-sorted.

**Tagline:** *Prize-first. Deadline-sorted. Builder-focused.*

---

## 2. Users

**Primary:** Builders, developers, designers, AI/Web3 founders, and vibecoders who are actively looking for hackathons to enter. This includes people who ship fast with AI tools and are looking for opportunities to build in public, win prizes, and grow their reputation.

**Secondary:** Hackathon organizers who want their event discovered (submit form).

---

## 3. Site Map

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hackathon directory with filters, sort, and search |
| `/hackathon/[slug]` | Detail | Full hackathon info, judging criteria, apply button |
| `/submit` | Submit | Form for organizers to list their hackathon (links to Tally.so) |
| `/newsletter` | Newsletter | Email signup (Brevo embed) |
| `/about` | About | One paragraph brand story |

---

## 4. Data Architecture

### Source of truth
`/data/hackathons.json` — manually maintained daily. Designed to be Hermes-ready (AI agent will automate daily updates later without schema changes).

### Hackathon schema

```typescript
interface Hackathon {
  // IDENTITY
  id: string                    // unique slug e.g. "ethglobal-bangkok-2025"
  name: string
  slug: string                  // matches id, used for URL
  description: string           // one sentence — shown on card
  longDescription: string       // markdown — shown on detail page

  // DATES (all ISO 8601)
  startDate: string             // "2025-06-01"
  endDate: string               // "2025-06-30"
  submissionDeadline: string    // may differ from endDate
  timezone: string              // "UTC" | "America/New_York" etc.

  // PRIZE
  prizePool: number             // total USD integer e.g. 250000
  prizeDisplay: string          // human label e.g. "$250,000" or "250K USDC"
  prizeBreakdown: {
    place: string               // "1st Place" | "Best AI Track" etc.
    amount: string
  }[]

  // CATEGORIZATION
  category: "AI" | "Web3" | "Both" | "Other"
  format: "Online" | "In-Person" | "Hybrid"
  tags: string[]                // freeform e.g. ["DeFi", "LLM", "Gaming"]

  // SOURCE
  organizer: string             // "ETHGlobal"
  applyUrl: string              // direct link to original listing
  sourceUrl: string             // where Hermes found it
  sourcePlatform: "devpost" | "dorahacks" | "lablab" | "gitcoin" | "other"

  // ELIGIBILITY
  isFree: boolean
  isOpen: boolean
  eligibility: string           // "Open worldwide" | "US only" etc.
  teamSize: string              // "1–4 members"

  // QUALITY SIGNALS
  isVerified: boolean           // manually confirmed by admin
  isFeatured: boolean           // pinned to top of results

  // JUDGING (shown on detail page)
  judgingCriteria: {
    name: string                // "Technical Innovation"
    weight: number              // 0–100
    description: string
  }[]

  // META
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
  dataSource: "manual" | "hermes"
  hermesConfidence: number | null  // 0–1, null if manual
}
```

---

## 5. Pages — Detailed Requirements

### 5.1 Home (`/`)

**Purpose:** Scannable directory. Builder lands here, finds a hackathon in under 30 seconds.

**Components:**
- Header with logo, nav links, search bar
- Hero — one line headline + live count of active hackathons
- FilterBar — category + format + deadline + eligibility filters
- Sort dropdown — Deadline soonest / Prize largest / Recently added
- HackathonGrid — responsive grid of HackathonCards
- Empty state — when no results match filters
- Footer

**Filter pills (stackable — multiple can be active simultaneously):**
- All *(clears all filters)*
- AI Only
- Web3 Only
- Online
- Offline *(In-Person)*
- Closing This Week *(≤7 days remaining)*
- Free to Enter

**Sort options:**
- Deadline soonest *(default)*
- Prize largest
- Recently added

**Search:** Client-side fuzzy search across `name` and `description` using Fuse.js. Searches in real time on keystroke.

**Auto-hide:** Expired hackathons (`daysRemaining <= 0`) never appear in the grid.

---

### 5.2 Hackathon Card

Every card must show:

```
┌─────────────────────────────────────────────┐
│ [Verified ✓]                    [$250,000]  │  ← prize: large, blue, IBM Plex Mono
│ Hackathon Name                              │  ← bold, Inter, large
│ 5 days remaining                            │  ← red if ≤7 days, mono
│ ─────────────────────────────────────────  │
│ One sentence description here               │
│                                             │
│ [AI] [Online] [Free]          [Apply →]    │  ← tags left, CTA right
└─────────────────────────────────────────────┘
```

**Countdown urgency:**
- `> 14 days` → muted color `#555555`
- `7–14 days` → secondary color `#888888`
- `1–6 days` → danger red `#f87171`, medium weight
- `0 days` → card hidden

**Card interactions:**
- Card click → navigates to `/hackathon/[slug]`
- Apply button click → opens `applyUrl` in new tab (does NOT navigate to detail page)
- Border shifts from `#1e1e1e` to `#2a2a2a` on hover. No glow. No lift.

---

### 5.3 Detail Page (`/hackathon/[slug]`)

**Sections:**
1. Back link → Home
2. Header: name, organizer, verified badge
3. Prize pool (large, prominent, blue mono)
4. Key stats row: Start date / End date / Deadline / Format / Team size / Eligibility
5. Category + format tags
6. Long description (rendered markdown)
7. Judging criteria (weighted list)
8. Prize breakdown table
9. Sticky Apply button (bottom or sidebar)

---

### 5.4 Submit Page (`/submit`)

**Purpose:** Organizers request their hackathon be listed.

**Implementation:** Links out to a Tally.so form (URL stored in `src/config/site.ts` as `TALLY_FORM_URL`). Page explains what we need, sets expectations (reviewed within 48 hours), then CTA button opens Tally.

**Do not build a native form.** The Tally link is the form.

---

### 5.5 Newsletter Page (`/newsletter`)

**Purpose:** Builders subscribe to get new hackathons in their inbox.

**Implementation:** Brevo embed or Brevo API form. Embed code stored as a component. Copy: "Get the best AI and Web3 hackathons delivered every Monday."

---

### 5.6 About Page (`/about`)

One paragraph. No headers. No bullet points. Brand story: what HackList is, why it exists, who built it.

---

## 6. Design System

### Theme

Both dark and light mode supported via `next-themes`. Default follows system preference (`prefers-color-scheme`). User can manually toggle via a theme button in the header — preference persisted in localStorage. CSS custom properties redefined under `[data-theme="light"]` in `tokens.css`. No flash of incorrect theme on load (handled by `next-themes` suppressHydrationWarning).

### Colors — Dark Mode (default)

| Token | Value | Usage |
|---|---|---|
| `--color-bg-base` | `#0a0a0a` | Page background |
| `--color-bg-surface` | `#111111` | Cards, panels |
| `--color-bg-elevated` | `#161616` | Dropdowns |
| `--color-border-default` | `#1e1e1e` | Card borders |
| `--color-border-strong` | `#2a2a2a` | Hover borders |
| `--color-text-primary` | `#e8e8e8` | Body text |
| `--color-text-secondary` | `#888888` | Labels, meta |
| `--color-text-muted` | `#555555` | Placeholder |
| `--color-accent` | `#3B82F6` | CTA, prize, links |
| `--color-success` | `#27ae60` | Open status |
| `--color-danger` | `#c0392b` | Closing soon |

### Colors — Light Mode

| Token | Value | Usage |
|---|---|---|
| `--color-bg-base` | `#f8f8f8` | Page background |
| `--color-bg-surface` | `#ffffff` | Cards, panels |
| `--color-bg-elevated` | `#f0f0f0` | Dropdowns |
| `--color-border-default` | `#e4e4e4` | Card borders |
| `--color-border-strong` | `#cccccc` | Hover borders |
| `--color-text-primary` | `#111111` | Body text |
| `--color-text-secondary` | `#555555` | Labels, meta |
| `--color-text-muted` | `#999999` | Placeholder |
| `--color-accent` | `#2563EB` | CTA, prize, links (deeper blue on light) |
| `--color-success` | `#16a34a` | Open status |
| `--color-danger` | `#dc2626` | Closing soon |

### Typography

| Use case | Font | Weight |
|---|---|---|
| All body, labels, UI | Inter | 400/500/600/700 |
| Prizes, dates, numbers, countdowns | IBM Plex Mono | 400/700 |

### Border Radius (max 3 values — strictly enforced)

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | Tags, badges, buttons, inputs |
| `--radius-md` | `8px` | Cards, panels |
| `--radius-lg` | `12px` | Modals, large surfaces |

### Animation

- **One easing curve:** `cubic-bezier(0.16, 1, 0.3, 1)` everywhere
- **Durations:** 120ms (fast) / 200ms (base) / 320ms (slow)
- **Allowed animations:** `opacity`, `transform: translateY(4px)`, `border-color`
- **Forbidden:** glow, scale bounce, gradient shifts, color floods

### Hard Rules

- No purple. No gradients. No glowing box-shadows. No hero emojis in UI chrome.
- Max 3 border radius values.
- Loading states on every async operation.
- `prefers-reduced-motion` respected unconditionally.
- All animations use `cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 7. Technical Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Search | Fuse.js (client-side) |
| Dates | date-fns |
| Fonts | next/font (Inter + IBM Plex Mono) |
| Data | `/data/hackathons.json` (static, no DB) |
| Theme | next-themes (system preference + manual toggle) |
| Newsletter | Brevo |
| Deployment | Vercel |

---

## 8. Config File

All environment-specific and easily-changed values live in `src/config/site.ts`:

```typescript
export const siteConfig = {
  name: "HackList",
  tagline: "Prize-first. Deadline-sorted. Builder-focused.",
  description: "The best place to find active AI and Web3 hackathons.",
  url: "https://hacklist.io",
  tallyFormUrl: "https://tally.so/r/XXXXXXX",  // replace with real URL
  brevoListId: "",                               // replace when Brevo is set up
  social: {
    twitter: "https://twitter.com/0xbeni",
  }
}
```

---

## 9. Build Order (Layers — Approval Required Between Each)

| Layer | Deliverable | Files |
|---|---|---|
| 1 | Design tokens | `src/styles/tokens.css` |
| 2 | Data layer | `src/lib/types.ts`, `src/lib/utils.ts`, `src/lib/data.ts`, `src/config/site.ts`, `data/hackathons.json` |
| 3 | UI primitives | `Badge`, `Button`, `Tag`, `Countdown`, `Input` |
| 4 | Layout | `Header`, `Footer`, `PageShell` |
| 5 | Hackathon components | `HackathonCard`, `HackathonGrid` |
| 6 | FilterBar + sort + search | `FilterBar` component |
| 7 | Home page | `app/page.tsx` |
| 8 | Detail page | `app/hackathon/[slug]/page.tsx` |
| 9 | Remaining pages | `submit`, `newsletter`, `about` |

---

## 10. Future — Hermes Integration

When the Hermes AI agent is plugged in:
- Hermes writes to `hackathons.json` (same schema, `dataSource: "hermes"`, `hermesConfidence: 0.0–1.0`)
- No schema changes required
- Admin reviews entries where `hermesConfidence < 0.8` before `isVerified` is set to `true`
- Hermes sources: DoraHacks, Devpost, Lablab.ai, Gitcoin, Superteam

---

## 11. Out of Scope (v1)

- User accounts or authentication
- Saved/bookmarked hackathons
- Comments or ratings
- Organizer dashboards
- Email notifications per hackathon
- Mobile app
