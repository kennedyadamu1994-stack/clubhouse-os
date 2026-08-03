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
  expand/collapse at every screen size via their header row.
- ⚠️ Brands & Businesses / Influencers still have no dedicated tab in the
  real database — flagged visibly on both pages, seed data only.
- ⏳ Workspace, Tools, Services — next in the build sequence

## This session's fixes (readability + desktop bugs Kennedy flagged)
1. **Grey boxes on Overview (desktop only)** — `.card-mobile-toggle` had
   `background: none` defined ONLY inside a mobile media query. At desktop
   widths the browser's native grey `<button>` styling showed through
   instead. Fixed with one correct style that applies everywhere.
2. **"Collapsible on mobile" was mobile-ONLY** — Kennedy asked for desktop
   collapse too. Rebuilt both `CollapsibleCard` (Overview sections) and
   `EntryCard` (Outreach results) so their header row is a real toggle at
   every width, not a mobile-only affordance. Entry cards previously
   duplicated the avatar/title markup once for mobile and once for desktop
   — that duplication is gone; there's one header row now, used everywhere.
3. **Measured contrast, didn't eyeball it** — calculated actual WCAG ratios
   for the app's secondary text colour and found it failing (3.0–3.4:1
   against a 4.5:1 requirement) in 19 places: card labels, timestamps, the
   token widget's subtitle line, chip text. Introduced `--faint-text`
   (`#948f89`, clears AA on every surface used) for anywhere `--faint` was
   holding actual text; `--faint` itself is now border/decoration only.
4. **Sort added** — a dropdown next to Filter on every Outreach subsection.
   Match-score sort is hidden entirely for pre-priorities clubs (nothing
   meaningful to sort by) rather than sorting by a fake zero.
5. **Match score, compact + square** — `MatchScoreBadge` now takes a
   `compact` prop rendering a small square with just the number, used in
   the tight entry-card header row; the wider "72% match" pill still shows
   on Overview's Top Recommendations, where there's room for it.

Every fix above was verified against a running server and its request log,
not just a clean `npm run build` — the previous session's crash also built
clean and only failed once a real page loaded, so a green build alone is
never treated as proof here.

## Run it (GitHub → Vercel only, no local terminal needed)
Unzip — **no wrapping folder** — drag everything onto your repo's file
list, commit, wait ~2 minutes for Vercel.

Demo dashboards (unguessable tokens — rotate before real use):
- **Populated club:** `/dashboard/hkfc-x7Kq2mZ9pR4wT8vN3sJ6`
- **Brand-new club:** `/dashboard/newc-b3Fh8nQ5tW2yL7xD4gV9`

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
- Apps Script files for daily backup + pink-button notifications (`/apps-script`)

## Next (in order)
1. Confirm with Kennedy: real tab for Brands & Businesses / Influencers, or fold into Clubs?
2. Answer DECISIONS.md D1/D2/D7; create the Google service account
3. Implement `lib/data/sheets.ts` against the real spreadsheet
4. Build Workspace (Insights, Opportunities, Resources, FAQ)
