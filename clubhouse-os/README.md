# Club House OS

Personalised dashboards for grassroots clubs, on top of The NBRH master database.
Governed by `CLAUDE.md` + `/docs` + `DECISIONS.md` — read those first.

## Run it now
```bash
npm install
npm run dev
```
Then open the two demo dashboards (unguessable club tokens — rotate before real use):
- **Demo Club A** (populated): `/dashboard/hkfc-x7Kq2mZ9pR4wT8vN3sJ6`
- **Demo Club B** (brand new — all empty states): `/dashboard/newc-b3Fh8nQ5tW2yL7xD4gV9`

On Club B, hit **Set your priorities** — recommendations appear immediately. That's the
personalisation layer working end-to-end on seed data.

## What's built (this foundation)
- Next.js app, club-token routing, **server-side club scoping** (invalid token → designed 404)
- Data-access layer (`lib/data`) with adapter pattern: `local` (seed JSON, active) and
  `sheets` (scaffolded — see `lib/data/sheets.ts` for the exact credential steps)
- **Ledger-based token system**: append-only Actions_Log, balance computed from the ledger,
  idempotency keys in `submitAction()` — double-clicks can never deduct twice
- Match scoring + profile completeness (`lib/scoring.ts`), weights read from Config
- App shell in the Club House OS design tokens: desktop sidebar, **mobile bottom tab bar**,
  always-visible token widget, "data as of" stamp
- Overview section: recommendations, KPIs, action tracker, community note — with designed
  empty states, verified against both demo clubs
- Priorities-capture form (v1 stand-in for the triage tool, D10)
- Apps Script files for the daily backup and the notification loop (`/apps-script`)

## What's next (in order — see CLAUDE.md Definition of Done)
1. Push to GitHub, connect Vercel
2. Answer DECISIONS.md D1/D2/D7; create the Google service account
3. Implement `lib/data/sheets.ts` against the real spreadsheet (**reconcile docs/schema.md
   with the real database first — the seed data columns are drafts**)
4. Shared Action Pop-up + Entry Card components → Outreach section
