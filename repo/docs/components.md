# Shared components — build these before any section that uses them

## 1. Entry Card
Used by all six Outreach subsections. Shows the GDPR-safe summary (role/type, area, tags, availability) + match-score badge where relevant + eye icon to expand detail. Consent-gated fields come pre-filtered from the data layer — the card never decides what's safe to show. Keyboard focusable; expansion announced to screen readers.

## 2. Action Pop-up (the most-reused component in the platform)
- Config-driven: takes an entry + a list of available actions from `Tokens_Reference`, renders black/pink buttons with token cost printed on each pink button. New action types = new sheet rows, **zero code changes**.
- Contains: free-text notes field (reuse the existing form-capture tech), "Report an issue with this action" button, and — if the club has never spent a token — the one-off token explainer.
- Submits through `submitAction()` with an idempotency key. Success state confirms cost and new balance. Failure states per architecture.md § Failure.
- Desktop: centred modal, focus-trapped, Esc to close. **Mobile (<640px): full-screen sheet.** Decided here once, inherited everywhere.
- Full keyboard navigation + ARIA labelling from the first build.

## 3. Token balance widget
Always visible, same position on every page (header on desktop, persistent on mobile). Shows balance from the ledger + progress bar of used vs. allocation. At zero: behaviour per D1.

## 4. Match-score badge
0–100 per architecture.md § Scoring, with a colour band. Tooltip: "How closely this matches your club's goals." Hidden (not shown as 0) when the club is pre-triage/pre-priorities.

## 5. Live entry-count badge
Every subsection header platform-wide: "1,000 players", "17 resources". Comes from cached data; shows the "data as of" stamp on hover.

## 6. Empty-state panel
One reusable component: icon + one line naming what's missing + one CTA button. Every section's empty states use it so they feel consistent, not improvised.

## 7. Notification pipeline (backend, not UI)
`Actions_Log` append → Apps Script trigger → D2 channel → `notified` flag + daily re-send sweep. Live before Outreach ships, so the very first real pink click notifies Kennedy.
