# CLAUDE.md — HackList

This file tells Claude Code exactly how to work on this project.
Read this fully before touching any file.

---

## What This Project Is

HackList is a hackathon discovery site. It is a **read-only aggregator** — not a platform. It does not host hackathons. Every Apply button links to an external URL. Think Google Flights for hackathons.

**Primary users:** Builders, developers, designers, AI/Web3 founders, and vibecoders — people who ship fast with AI tools and enter hackathons to build in public, win prizes, and grow their reputation.

---

## How to Work With Me

### Layer-by-layer builds
This project is built in strict layers. **Do not skip ahead.**
When I ask for a layer, build only that layer. Show me the output. Wait for explicit approval before proceeding.

Current layer order:
1. Design tokens (`src/styles/tokens.css`)
2. Data layer (types, utils, data loader, seed JSON, config)
3. UI primitives (Badge, Button, Tag, Countdown, Input)
4. Layout (Header, Footer, PageShell)
5. HackathonCard + HackathonGrid
6. FilterBar (filters + sort + search)
7. Home page
8. Detail page
9. Submit, Newsletter, About pages

### Get approach approval before writing code
If a task is ambiguous or has multiple valid approaches, **describe the approach first** and wait for my go-ahead. Do not write code based on assumptions about architectural decisions.

### One fix at a time
When debugging, fix one thing, show me the result, then move to the next issue. Never chain multiple fixes in one message without showing me intermediate state.

### Commit before moving on
After each layer is approved and working, remind me to commit before starting the next layer.

---

## Project Structure

```
hacklist/
├── data/
│   └── hackathons.json          ← single source of truth, never auto-generated
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             ← home
│   │   ├── hackathon/[slug]/
│   │   │   └── page.tsx
│   │   ├── submit/page.tsx
│   │   ├── newsletter/page.tsx
│   │   └── about/page.tsx
│   ├── components/
│   │   ├── ui/                  ← primitives only (Badge, Button, etc.)
│   │   ├── hackathon/           ← domain components
│   │   └── layout/              ← Header, Footer, PageShell
│   ├── config/
│   │   └── site.ts              ← all configurable constants
│   ├── lib/
│   │   ├── types.ts             ← all TypeScript interfaces
│   │   ├── data.ts              ← JSON loader + filter/sort/search logic
│   │   └── utils.ts             ← date helpers, countdown, formatting
│   └── styles/
│       └── tokens.css           ← design system tokens (single source of truth)
├── PRD.md
└── CLAUDE.md
```

---

## Design Rules — Enforce Strictly

These are non-negotiable. If something violates these rules, do not implement it.

### Theme System
- Both dark and light mode via `next-themes`
- Default: system preference (`prefers-color-scheme`)
- Manual toggle: sun/moon icon button in Header (no label, icon only)
- All colors use CSS custom properties — never hardcode hex values in components
- Light mode tokens defined under `[data-theme="light"]` in `tokens.css`
- Add `suppressHydrationWarning` to `<html>` tag to prevent theme flash

### Colors — Dark Mode
- Background: `#0a0a0a`
- Surface/cards: `#111111`
- Borders: `#1e1e1e` (default) / `#2a2a2a` (hover/strong)
- Text: `#e8e8e8` (primary) / `#888888` (secondary) / `#555555` (muted)
- Accent: `#3B82F6` — CTAs, prize amounts, active states, links
- Success: `#27ae60` — open status only
- Danger: `#c0392b` / text `#f87171` — closing soon, urgent countdowns

### Colors — Light Mode
- Background: `#f8f8f8`
- Surface/cards: `#ffffff`
- Borders: `#e4e4e4` (default) / `#cccccc` (hover/strong)
- Text: `#111111` (primary) / `#555555` (secondary) / `#999999` (muted)
- Accent: `#2563EB` — slightly deeper blue for contrast on light
- Success: `#16a34a`
- Danger: `#dc2626`

### Typography
- **Inter** — all body text, labels, UI copy, headings
- **IBM Plex Mono** — prize amounts, dates, countdown timers, numbers ONLY
- Load both via `next/font` in `app/layout.tsx`

### Border Radius — MAXIMUM 3 VALUES
```
--radius-sm: 4px   → tags, badges, buttons, inputs
--radius-md: 8px   → cards, panels, dropdowns
--radius-lg: 12px  → modals, large surfaces
```
Never use any other border radius value anywhere in the project.

### Animations
- One easing curve only: `cubic-bezier(0.16, 1, 0.3, 1)`
- Allowed properties to animate: `opacity`, `transform`, `border-color`, `background-color`
- Durations: 120ms / 200ms / 320ms
- Always include `@media (prefers-reduced-motion: reduce)` override

### Forbidden
- Purple of any shade
- Gradient backgrounds
- Glowing box-shadows (e.g. `box-shadow: 0 0 20px rgba(59, 130, 246, 0.5)`)
- Emoji in UI chrome (no hero emoji, no decorative emoji in headers/nav)
- Scale transforms on hover (no `scale(1.02)` card lifts)
- Any border radius value other than 4px, 8px, or 12px

### Card hover state
```css
/* CORRECT */
border-color: var(--color-border-strong); /* #2a2a2a */
transition: border-color 200ms cubic-bezier(0.16, 1, 0.3, 1);

/* FORBIDDEN */
box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
transform: translateY(-2px) scale(1.02);
```

---

## Data Rules

### Never modify the schema without flagging it
The `hackathons.json` schema is designed to be Hermes-ready (AI agent will later auto-populate it). If you think the schema needs to change, **tell me first** and explain why.

### Expired hackathons
Cards where `daysRemaining <= 0` must **never appear** in the grid. Filter them in `data.ts`, not in the component.

### Countdown urgency thresholds
```
> 14 days  → color: #555555 (muted)
7–14 days  → color: #888888 (secondary)
1–6 days   → color: #f87171 (danger), font-weight: 500
0 days     → hidden (filtered out upstream)
```

---

## Filters

Filters are **stackable** — multiple can be active at the same time.

| Filter key | Logic |
|---|---|
| `all` | Clears all filters |
| `ai` | `category === "AI"` |
| `web3` | `category === "Web3"` |
| `both` | `category === "Both"` |
| `online` | `format === "Online"` |
| `offline` | `format === "In-Person"` |
| `closing-soon` | `daysRemaining <= 7` |
| `free` | `isFree === true` |

Filter + sort + search logic all lives in `src/lib/data.ts` as pure functions. Components do not contain filter logic.

---

## TypeScript Rules

- Strict mode always on
- No `any` types — ever
- All data shapes defined in `src/lib/types.ts`
- Prefer `type` over `interface` for unions, use `interface` for object shapes
- All utility functions in `src/lib/utils.ts` must be pure (no side effects)

---

## Component Rules

- Every component gets its own file
- No inline styles — use CSS custom properties from `tokens.css` via Tailwind or className
- Props interfaces defined at top of each component file
- Loading states required on every async operation
- Empty states required on every list/grid component

---

## Config

All hardcoded strings, URLs, and settings live in `src/config/site.ts`.

```typescript
export const siteConfig = {
  name: "HackList",
  tagline: "Prize-first. Deadline-sorted. Builder-focused.",
  description: "The best place to find active AI and Web3 hackathons.",
  url: "https://hacklist.io",
  tallyFormUrl: "https://tally.so/r/XXXXXXX",
  social: {
    twitter: "https://twitter.com/0xbeni",
  }
}
```

Never hardcode the site name, URLs, or tagline inside components.

---

## Dependencies to Install

```bash
npm install next-themes fuse.js date-fns
npm install @types/node --save-dev
```

```bash
# Dev server
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build

# Lint
npm run lint
```

Always run `npx tsc --noEmit` after completing a layer to catch type errors before showing me the result.

---

## When You're Unsure

1. Re-read `PRD.md`
2. Re-read `CLAUDE.md`
3. If still unsure — **ask, don't assume**

