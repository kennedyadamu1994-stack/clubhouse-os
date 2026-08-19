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
 * One tab added for Services (docs/schema.md § Services, spec.md § 4.5/12): getServices()
 * reads Services — a simple list (name, category, description, hourly_rate), not club-scoped
 * (every club sees the same service list). The "get in touch" action on each service reuses
 * the existing submitAction() ledger path with action_key "service_enquiry" (already in
 * Tokens_Reference at 0 tokens) and the service's service_id as entry_id — nothing new needed
 * on the write side for this section.
 *
 * NOT part of this adapter: the platform-wide "Session Insights" block at the bottom of
 * Workspace → Insights (components/session-insights.tsx) fetches directly from a public
 * opensheet.elk.sh endpoint, client-side, at runtime — it's a different Google Sheet entirely
 * ("Core Sessions", not this app's own Clubs/Players/etc. tabs) and isn't club data, so there's
 * nothing here for club-scoping to apply to. Leave that fetch where it is; don't try to route
 * it through this adapter or cache it the same way as club-scoped reads.
 *
 * getAllActions() (Kennedy's private admin datalog, app/admin/requests): plain values.get on
 * Actions_Log, EVERY row, no club_id filter — the same "deliberate exception" as
 * getAllClubsForDirectory() above, not a new pattern. Sort newest-first same as the local
 * adapter. Never called from a club-facing route; nothing to gate here since no PII lives on
 * an ActionLogRow itself (names/contact details are already gated at the Player/Person/Brand
 * level before an entry_id is ever attached to a request).
 *
 * resetTokenBalance() (admin "reset balance" button, app/admin/requests): values.append ONE
 * new row to Actions_Log with type "adjustment", token_cost equal to the club's current
 * shortfall (allocation − balance), action_key "balance_reset" — same append-only contract as
 * submitAction(), never edits or deletes an existing row.
 *
 * setActionStatus() (admin "mark as logged" toggle, app/admin/requests): values.update on the
 * single existing Actions_Log row matched by log_id — sets status and completed_at only, no
 * other column touched. The ONE deliberate exception to "Actions_Log is append-only" (unlike
 * every write above): this edits a row in place rather than appending, because it's correcting
 * Kennedy's own tracking of a request he's already fulfilled, not creating a new ledger event —
 * token_cost is untouched either way, so a club's balance can never be affected by this toggle.
 *
 * One tab added for Tools → Calendar (docs/schema.md § Events, D6 v1): getEvents() reads
 * Events — Kennedy maintains this tab by hand. Calendar combines it with dated Opportunities
 * rows client-side (components/calendar-view.tsx); Events isn't club-scoped (every club sees
 * the same platform-wide events), so no filtering by club_id happens here.
 *
 * Two tabs added (Kennedy, 17 Aug):
 *   - getPerks() reads Perks — partner benefits (partner, title, category, offer, redeem_code,
 *     redeem_url, plan_tiers, active). Not club-scoped in storage, but the Perks page filters by
 *     the viewing club's plan_tier: a Premium-only perk is shown-but-locked to Core clubs.
 *     Redeeming is a plain external link (redeem_url) — NOT a token/ledger action, so nothing to
 *     add on the write side.
 *   - getTrendingTopics() reads Trending — tailored news/articles (headline, source, category,
 *     summary, why_it_matters, url, published_at), sorted newest-first. Read-only external links,
 *     no write path. Lives under Workspace. Every club sees the same list for now; the
 *     "why_it_matters" copy is written to reference club goals generically (real per-club
 *     tailoring would be a later enhancement, not needed for the pilot).
 */
export {};
