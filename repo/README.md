# Club House OS

Personalised dashboards for grassroots clubs, on top of The NBRH master database.
Governed by `CLAUDE.md` + `/docs` + `DECISIONS.md` — read those first.

## Status
- ✅ **Overview** — built, tested. Six shortcut tiles removed per Kennedy's edit;
  every card is mobile-collapsible.
- ✅ **Outreach** — all six subsections rebuilt with: search + filter bars, a
  0–100% match-score badge on every colour-scale (red→yellow→green), real
  images with an initials placeholder fallback, and mobile-collapsible cards.
  The "Find and contact your neighbourhood" title is removed per Kennedy's edit.
- ⚠️ **Schema reconciled against the real database** (docs/schema.md) — People
  now matches the real PEOPLE tab columns exactly. **Brands & Businesses and
  Influencers have no dedicated tab in the real database** — both subsections
  say so visibly on the page and keep running on seed data until Kennedy adds
  a real source (or confirms Outreach → Clubs, which now reads the real CLUBS
  tab, should be the only "business" list).
- ⏳ Workspace, Tools, Services — next in the build sequence

## Match-score colour scale (lib/match-colour.ts)
0% = deep red, 50% = bright yellow, 100% = dark green, with a genuine HSL
gradient in between — not three fixed colours. Verified against real hex
output before shipping (an early version made 50% look muddy olive rather
than yellow; fixed by peaking lightness at the midpoint rather than a flat
curve). Weights for the underlying match score live in Config
(lib/data — getScoreWeights), editable without a code change.

## Run it (GitHub → Vercel only, no local terminal needed)
Unzip this — **no wrapping folder**, drag everything you see straight onto
your repo's file list, commit, wait ~2 minutes for Vercel to redeploy.

Demo dashboards (unguessable tokens — rotate before real use):
- **Populated club:** `/dashboard/hkfc-x7Kq2mZ9pR4wT8vN3sJ6`
- **Brand-new club:** `/dashboard/newc-b3Fh8nQ5tW2yL7xD4gV9` (no match scores
  shown anywhere — correct: pre-priorities clubs get the empty-state path)

## A bug worth knowing about (caught before shipping, not after)
The first version of the search/filter rewrite passed JavaScript functions
as props into a Client Component (`OutreachList`), which Next.js's
Server/Client boundary silently rejects at runtime — it builds clean but
crashes on every page load. Caught by actually starting the server and
reading its log, not by trusting `npm run build`. Fixed by having each
server-component page pre-compute plain-string search text and filter
values, handing the Client Component data instead of logic. Documented here
so the same mistake isn't repeated when Workspace's own lists get built.

## What's built (cumulative)
- Next.js app, club-token routing, server-side club scoping, invalid token → 404
- Data-access layer (`lib/data`) — local adapter active, Sheets adapter scaffolded
- Ledger-based token system with idempotency keys
- Match scoring (`lib/scoring.ts`) + colour scale (`lib/match-colour.ts`)
- Shared Entry Card, Action Pop-up, Search/Filter Bar, Outreach List, Collapsible
  Card — mobile-first, keyboard-navigable, ARIA-labelled
- Overview + Outreach (all 6 subsections, search/filter/match-score/images) +
  Priorities capture form
- Collapsible sidebar sections, collapsible mobile cards throughout
- Apps Script files for daily backup + pink-button notifications (`/apps-script`)

## Next (in order)
1. Confirm with Kennedy: should Brands & Businesses / Influencers get a real
   tab, or be merged into/replaced by the real CLUBS-backed Clubs subsection?
2. Answer DECISIONS.md D1/D2/D7; create the Google service account
3. Implement `lib/data/sheets.ts` against the real spreadsheet
4. Build Workspace (Insights, Opportunities, Resources, FAQ)
