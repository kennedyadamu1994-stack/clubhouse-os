# Club House OS

Personalised dashboards for grassroots clubs, on top of The NBRH master database.
Governed by `CLAUDE.md` + `/docs` + `DECISIONS.md` — read those first.

## Status
- ✅ **Overview** — built, tested, demoed against both seed clubs
- ✅ **Outreach** — built this session. All six subsections live: Players, People,
  Brands & Businesses, Influencers, Sponsorship & Funding, Clubs. Shared Entry
  Card + Action Pop-up components power every one — new action types are new
  `Tokens_Reference` rows, not new code.
- ⏳ Workspace, Tools, Services — next in the build sequence

## Run it (GitHub → Vercel only, no local terminal needed)
Push this repo to GitHub, connect it to Vercel, set **Root Directory** to the
folder this README lives in if nested, and set **Framework Preset** to Next.js.
Every push to `main` redeploys automatically.

Demo dashboards (unguessable tokens — rotate before real use):
- **Populated club:** `/dashboard/hkfc-x7Kq2mZ9pR4wT8vN3sJ6`
- **Brand-new club:** `/dashboard/newc-b3Fh8nQ5tW2yL7xD4gV9`

Try Outreach → Players on the populated club and click "View options" on any
entry — you'll see the black/pink pattern, the token cost, the notes field,
and "Report an issue," all working exactly as specced. Note: saving/submitting
only *persists* once the Google Sheets adapter is wired in (writes on Vercel
today update the demo data in-memory for that request only, since serverless
functions can't rewrite their own bundled files — this is expected, not a bug).

## Design
Palette, spacing, and component language now matches Kennedy's original Guided
Deck concept exactly: `#1B1B1B` background, `#232221` surface, `line`/`sunken`
tokens, the pill-shaped askbar search treatment, numbered eyebrow labels, and
the raised-centre mobile tab bar pattern. See `app/globals.css`.

## What's built (cumulative)
- Next.js app, club-token routing, **server-side club scoping** (invalid token → designed 404)
- Data-access layer (`lib/data`) — adapter pattern: `local` (seed JSON, active)
  and `sheets` (scaffolded, see `lib/data/sheets.ts` for exact credential steps)
- **Ledger-based token system**: append-only Actions_Log, idempotency keys —
  double-clicks/retries can never deduct twice
- Match scoring + profile completeness (`lib/scoring.ts`)
- Shared **Entry Card** (`components/entry-card.tsx`) and **Action Pop-up**
  (`components/action-popup.tsx`) — keyboard-navigable, ARIA-labelled,
  full-screen sheet on mobile, config-driven black/pink buttons
- GDPR consent gating enforced in the data layer (`lib/data/index.ts`), never
  in components — names/contact info withheld unless the row's consent flag is TRUE
- Overview + Outreach (all 6 subsections) + Priorities capture form
- Apps Script files for the daily backup and pink-button notifications (`/apps-script`)

## Next (in order)
1. Answer DECISIONS.md D1/D2/D7; create the Google service account
2. Implement `lib/data/sheets.ts` against the real spreadsheet (reconcile
   `docs/schema.md` with the real database first)
3. Build Workspace (Insights, Opportunities, Resources, FAQ) — reusing Entry
   Card/Action Pop-up wherever it lists things
