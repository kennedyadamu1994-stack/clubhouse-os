# Club House OS

Personalised dashboards for grassroots clubs, on top of The NBRH master database.
Governed by `CLAUDE.md` + `/docs` + `DECISIONS.md` — read those first.

## Status
- ✅ **Overview** — built, tested. Six shortcut tiles removed. Every card
  genuinely expands/collapses at every screen size (desktop included).
- ✅ **Outreach** — all six subsections: search + filter + **sort** (best
  match / name A–Z / closing-soonest where relevant), a compact square
  match-score badge on every colour-scale (red→yellow→green), real images
  with an initials placeholder fallback, and entry cards that
  expand/collapse at every screen size via their header row. Rows are the
  redesigned version (real padding, 3-column grid) — see changelog below.
- ✅ **Splash pages** — a general welcome screen at `/`, and a personalised
  one per club at `/dashboard/[clubToken]/welcome` using that club's own
  header photo, name, sport, and area. The old pilot club-picker lives at
  `/directory` now, not `/`.
- ✅ **Workspace** — Insights (club-specific comparison + a platform-wide
  session-data block below it), Opportunities (incl. club-submitted
  call-outs), Resources, FAQ all live. Copy Generator is a designed
  "coming soon" tile — DECISIONS.md D5 is still **OPEN** and blocks it.
- ⚠️ Brands & Businesses / Influencers still have no dedicated tab in the
  real database — flagged visibly on both pages, seed data only.
- ⏳ Tools, Services — next in the build sequence

## Important: what actually reached this repo before today
Two earlier sessions built the entry-row redesign, both splash pages, and
a first version of Workspace, and packaged each as a zip — but re-cloning
this repo fresh at the start of today's session showed only the entry-row
redesign and splash pages had actually been dragged onto GitHub. The first
Workspace build hadn't landed at all. Everything in this README's
changelog is what's now actually IN this zip, verified against a real
running server — not a record of what was previously handed over. If a
future session finds gaps between this README and the live site, check
whether the most recent zip was actually uploaded before assuming a build
step was skipped.

## Run it (GitHub → Vercel only, no local terminal needed)
Unzip — **no wrapping folder** — drag everything onto your repo's file
list, commit, wait ~2 minutes for Vercel.

The links you hand to clubs should point at `/welcome`, not the bare
dashboard URL — that's the splash screen; its own button sends them into
the real dashboard.

Demo dashboards (unguessable tokens — rotate before real use):
- **Populated club:** `/dashboard/hkfc-x7Kq2mZ9pR4wT8vN3sJ6/welcome`
- **Brand-new club:** `/dashboard/newc-b3Fh8nQ5tW2yL7xD4gV9/welcome`

## What's built (cumulative)
- Next.js app, club-token routing, server-side club scoping, invalid token → 404
- Data-access layer (`lib/data`) — local adapter active, Sheets adapter scaffolded
- Ledger-based token system with idempotency keys
- Match scoring (`lib/scoring.ts`) + colour scale (`lib/match-colour.ts`),
  verified against real hex output, not assumed correct from HSL numbers alone
- Shared Entry Card, Action Pop-up, Search/Filter/Sort Bar, Outreach List,
  Collapsible Card — all genuinely collapsible at every screen size,
  keyboard-navigable, ARIA-labelled, AA-contrast text throughout
- Overview + Outreach (all 6 subsections) + Priorities capture form
- General and per-club splash/welcome pages
- Workspace: Insights (club comparison + platform-wide session data),
  Opportunities (incl. club-submitted call-outs via `ListCalloutButton`),
  Resources (library + category filter), FAQ (searchable accordion),
  Copy Generator (deferred tile, D5 open)
- Apps Script files for daily backup + pink-button notifications (`/apps-script`)

## Next (in order)
1. Confirm with Kennedy: real tab for Brands & Businesses / Influencers, or fold into Clubs?
2. Answer DECISIONS.md D1/D2/D5/D7; create the Google service account
3. Implement `lib/data/sheets.ts` against the real spreadsheet — now also
   needs `getResources()`/`getFaq()`/`getPeerCompletenessScores()`, see
   that file's own notes. (The platform-wide session data on Insights is
   deliberately NOT part of this — see its own note below.)
4. Build Tools (Contact Us, Find, Calendar) and Services
5. Once D5 lands, build Copy Generator for real
6. Overview's own spec calls for an area-only "neighbourhood ranking" that
   isn't built yet — don't confuse this with Workspace → Insights' sport+area
   comparison table, which is a separate, already-built thing
   (`lib/scoring.ts` → `peerComparison()`)

## Changelog

### This session: Insights — real code found and integrated
Kennedy provided the actual standalone HTML tool referenced by the build
spec as "existing Insights page code" — a platform-wide session-data
dashboard (price, ratings, capacity, popularity across every NBRH session),
fetching live from a public Google Sheet, with its own design system.

- **Confirmed it's genuinely a different thing** from what "Insights"
  meant in last session's build: that one is club-specific (this club's
  completeness score vs. similar clubs nearby); this one is the same for
  every club, platform-wide. Rather than picking one, both are on the page
  now — club-specific at the top (actionable, personalised), platform-wide
  below it (general context, clearly labelled "Beyond your club").
- **Ported, not embedded.** The original is a full standalone HTML
  document — its own fonts, its own CSS variables, its own nav/footer. Its
  actual card-building logic (the rank-card top/bottom toggle, the sport/
  borough/day filter bar, all the stat calculations) is ported faithfully
  into `components/session-insights.tsx` as a client component, restyled
  onto this app's own design tokens rather than shipping a second parallel
  CSS system.
- **Kept as a separate data path on purpose.** This fetches directly from
  `opensheet.elk.sh` client-side — not through `lib/data`. That's not an
  oversight: `lib/data` exists specifically to enforce per-club scoping
  (CLAUDE.md rule 1), and there's no club data here to scope — it's the
  same numbers for everyone. Routing it through that layer would blur a
  distinction worth keeping visible. See `docs/schema.md` § Core Sessions
  and this component's own top-of-file comment.
- Rebuilt the rest of Workspace (Opportunities, Resources, FAQ, Copy
  Generator tile, nav) from scratch on top of the actual current repo
  state, since last session's Workspace zip hadn't been uploaded — see the
  note above. Same content as before, verified fresh against a real server
  rather than assumed carried over.

### Previous session: entry-row redesign + splash pages
Fixed the entry-row spacing/density Kennedy flagged (text sat right
against the row edges; a 3-column grid layout with real padding replaced
the old flex layout), and added two splash/welcome screens — general at
`/`, personalised per club at `/dashboard/[clubToken]/welcome`. The old
pilot club-picker moved from `/` to `/directory`.

### Earlier session: collapsible pattern removed from Outreach entries
Kennedy flagged (with his own demo screenshot as reference) that the
collapsible entry-card pattern didn't work — every player/person/brand
collapsed into a bare toggle row, when his own demo shows plain rows with
real context always visible (name, one line describing what they're
looking for, a status chip, an action button). Rebuilt `EntryCard` from
scratch to match: one plain row per entry, everything visible immediately.
The "i" button still reveals a small detail strip inline (fields that
genuinely don't fit in the row), but that's the only expand/collapse left.

### Earlier session: readability + desktop bugs
1. **Grey boxes on Overview (desktop only)** — a toggle button's
   "invisible" styling only existed inside a mobile media query; fixed
   with one style that's correct everywhere.
2. **"Collapsible on mobile" was mobile-only** when desktop collapse was
   wanted too — both `CollapsibleCard` and `EntryCard` rebuilt so their
   header row is a real toggle at every width.
3. **Text contrast was failing WCAG AA** in ~19 places (3.0–3.4:1 against
   a 4.5:1 requirement) — found by calculating actual ratios, not
   eyeballing. Introduced `--faint-text` for anywhere `--faint` was
   holding real text.
4. **Sort added** — a dropdown next to Filter on every Outreach
   subsection, hidden entirely for pre-priorities clubs.
5. **Match score, compact + square** — `MatchScoreBadge` gained a
   `compact` prop for the tight entry-card header row.

Every fix above and since has been verified against a real running server
and its request log, not just a clean `npm run build` — a previous
session's crash also built clean and only failed once a real page loaded,
so a green build alone is never treated as proof here.
