/**
 * Google Sheets adapter — SCAFFOLD. Not active yet.
 *
 * The local adapter (index.ts) runs the app today against /data/*.json seed data,
 * whose files map 1:1 to the sheet tabs in docs/schema.md. Wiring this up is the
 * first Claude Code session after Kennedy has:
 *
 *   1. Created a Google Cloud project → enabled the Google Sheets API
 *   2. Created a service account, downloaded its JSON key
 *   3. Shared the master spreadsheet with the service-account email (Editor)
 *   4. Set in Vercel/.env.local:
 *        GOOGLE_SERVICE_ACCOUNT_EMAIL  (from the key file: client_email)
 *        GOOGLE_PRIVATE_KEY            (from the key file: private_key — keep the \n escapes)
 *        SHEET_ID                      (from the spreadsheet URL)
 *        DATA_ADAPTER=sheets
 *
 * Implementation notes for that session:
 *   - Auth: sign a JWT with the private key (scope https://www.googleapis.com/auth/spreadsheets)
 *     and exchange at https://oauth2.googleapis.com/token — or use the `googleapis` package.
 *   - Reads: values.batchGet across the tabs listed in docs/schema.md, parsed against lib/types.ts.
 *     Cache every read (unstable_cache / revalidate ~300s; Clubs + Actions_Log ~60s) and surface
 *     the cache timestamp through dataAsOf() — architecture.md § Data-access layer.
 *   - Writes: submitAction() = values.append on Actions_Log ONLY (append-only ledger, idempotency
 *     check by reading the idempotency_key column first — same contract as the local adapter).
 *   - setClubPriorities() = values.update on the club's single row in Clubs.
 *   - Failure behaviour per architecture.md § Failure: stale cache up to 24h, designed error state,
 *     never a crash; writes retry once with the same idempotency key.
 *
 * The DataAdapter interface in index.ts is the contract — implement it exactly and the entire
 * app switches over with zero component changes.
 *
 * Two tabs added for Workspace (docs/schema.md § Resources, § FAQ):
 *   - getResources() reads Resources; getFaq() reads FAQ, sorted by its `order` column.
 * getPeerCompletenessScores() must NEVER return full Club rows over the wire — read Clubs,
 * filter server-side to sport+area matches excluding the requesting club, then return only
 * the computed profileCompleteness() numbers. The point of a separate method (instead of
 * reusing getAllClubsForDirectory()) is that this one is safe to call from every real club's
 * Insights page; the directory method is not.
 *
 * NOT part of this adapter: the platform-wide "Session Insights" block at the bottom of
 * Workspace → Insights (components/session-insights.tsx) fetches directly from a public
 * opensheet.elk.sh endpoint, client-side, at runtime — it's a different Google Sheet entirely
 * ("Core Sessions", not this app's own Clubs/Players/etc. tabs) and isn't club data, so there's
 * nothing here for club-scoping to apply to. Leave that fetch where it is; don't try to route
 * it through this adapter or cache it the same way as club-scoped reads.
 *
 * One tab added for Tools → Calendar (docs/schema.md § Events, D6 v1): getEvents() reads
 * Events — Kennedy maintains this tab by hand. Calendar combines it with dated Opportunities
 * rows client-side (components/calendar-view.tsx); Events isn't club-scoped (every club sees
 * the same platform-wide events), so no filtering by club_id happens here.
 */
export {};
