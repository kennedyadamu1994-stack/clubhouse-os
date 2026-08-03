# Architecture

## Stack
Next.js (App Router) on Vercel · GitHub repo `clubhouse-os` · Google Sheets API via service account · Google Apps Script for notifications + daily backups. Env vars in Vercel: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SHEET_ID`, plus whatever the notification channel needs (D2).

## Auth & club scoping (v1 — decision D3)
- Each club's dashboard URL is `/dashboard/[clubToken]` where `clubToken` is a random, unguessable 21+ char string (nanoid), stored in the `Clubs` sheet alongside the human-readable `club_id`.
- **All Sheets reads happen server-side** (server components / route handlers). The server resolves `clubToken → club_id` and filters every query by it. The client never receives another club's rows — scoping is not a UI filter.
- Kennedy can revoke access by replacing a club's token in the sheet (old link dies instantly).
- Sequential or guessable IDs must never appear in URLs. No passwords in the pilot; if a club leaks its link, rotate the token.

## Data-access layer
- One module (`lib/data.ts`) that every page calls; nothing queries Sheets directly.
- Reads are cached (Next.js revalidation, ~5 min default; `Clubs` row and token balance ~60 s). Every page shows a "data as of HH:MM" stamp sourced from the cache time.
- Writes (actions, forms) go through a single `submitAction()` path — see Token ledger.

## Token ledger (no in-place balance edits)
- `Actions_Log` is **append-only** and is the source of truth.
- Balance = allocation (from `Config`, per plan tier once D8 is set) + manual adjustment rows − sum of logged costs, computed on read. The `tokens_display` column in `Clubs` is a convenience cache written by Apps Script, never authoritative.
- Every submission carries a client-generated **idempotency key**; before appending, the server checks the log for that key so a retry or double-click can never deduct twice.
- Kennedy adjusts balances by appending an `adjustment` row (positive or negative), never by editing history.
- Refill/expiry behaviour depends on **D1**; the log already carries `timestamp` so either monthly-reset or rollover can be computed without schema change.

## Scoring (v1 — decision D4)
All weights live in the `Config` sheet so Kennedy tunes them without code.
- **Match score (0–100):** sport match +30 · borough/area match +25 · each shared priority tag +10 (cap 30) · urgency bonus +15 if a closing date is within 30 days. Sum, cap at 100. Entries missing data score on what exists — never error.
- **Club health score:** derived from triage output once D10 ships. Interim: profile completeness % (filled fields ÷ expected fields on the club's row), clearly labelled "Profile completeness" until triage exists — don't present it as health.
- **Neighbourhood ranking:** rank of health/completeness score among clubs sharing the same area value. With <5 clubs in an area, show "Not enough clubs nearby to rank yet" instead of a misleading position.

## Notifications (Kennedy's loop)
- Every pink-button action: append log row → Apps Script `onChange` trigger fires the D2 channel with club name, action, token cost, notes, and a direct link to the log row.
- If the notification send fails, the log row still exists and is marked `notified = FALSE`; a daily Apps Script sweep re-sends any unnotified rows. Kennedy is never dependent on noticing a sheet change.
- Pending-work view: a filtered `Actions_Log` tab — status = pending, oldest first — is Kennedy's queue during the pilot. No admin panel.

## Kennedy's admin surface (pilot = the Sheet itself)
He hand-edits: `Config` (weights, token costs via `Tokens_Reference`, allocations), `Clubs.community_note`, `Events`, all directory tabs (Players/People/Brands/…), and `Actions_Log.status` (pending → complete). The app treats all of these as read-mostly inputs and must tolerate mid-day edits (cache revalidation covers this). **Do not build admin UI.**

## Failure behaviour
- **Sheets read fails / quota hit:** serve the last cached data (up to 24 h old) with the "data as of" stamp; if no cache exists, show a designed error state with a retry button — never a crash or blank.
- **Write fails:** retry once with the same idempotency key; on second failure show "We couldn't log this — nothing was deducted, try again," and do not show a success state.
- **Partial data:** any row missing fields renders with what it has; missing fields collapse, they don't print "undefined."

## Resilience
- Daily Apps Script snapshot: copy the entire spreadsheet to a dated backup file in a Drive folder; keep 30 days.
- Migration trigger (D7) recorded in README once decided; check it monthly during pilot.

## Seed data (so nothing is built against emptiness)
`scripts/seed.md` documents two demo clubs plus sample rows for every tab:
- **Demo Club A** — post-triage: full profile, KPIs, 6 logged actions, mid token balance. Used to build populated states.
- **Demo Club B** — brand new: token in place, everything else empty. Used to build and test every empty state and the first-run flow.
Sample rows: ~10 players, 8 people across roles, 6 brands, 4 influencers, 5 sponsorships (varied closing dates), 6 opportunities, 8 resources across all four categories, full services list, token reference table from sections/05 appendix.

## Universal search (v1 scope — keep it small)
Client-side filter over the current club's already-cached datasets: entry names/titles/tags across all Outreach tabs, opportunities, resources, services, FAQ questions, and a hardcoded index of tool/page names. Substring match, grouped results dropdown, keyboard navigable. **Not** a search engine, no server round-trip, no fuzzy ranking in v1.
