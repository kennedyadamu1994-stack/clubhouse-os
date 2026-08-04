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
 */
export {};
