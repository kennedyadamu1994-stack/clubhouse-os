# Section 3 — Workspace

## Insights
Reuse the existing expanded Insights page code — **confirm its location and state with Kennedy before estimating this as "reuse."** Adds: comparison table vs. clubs with the same `sport`/`area` (aggregate stats only — never another club's identifiable data), improvement advice, and the entry point to the triage tool (D10; until built, links to the priorities-capture form).

## Copy Generator — ⛔ blocked on D5
Do not scaffold until decided. (a) standalone tool → new API key + usage caps per club; (b) requestable service → it's just a `Tokens_Reference` row + Action Pop-up, ~an hour of work. If D5 is unanswered when this section starts, build everything else and leave a designed "Coming soon — request copy support via Services" tile. That is the one permitted deferral, because it's an explicit open decision, not scope-cutting.

## Opportunities
List from `Opportunities` (type ≠ callout handled same as callouts, all in one list, filterable by type). Clubs can submit their own call-out via the Action Pop-up (pink, 1 token, `submitted_by_club_id` set, status = pending until Kennedy approves by flipping status in the sheet).

## Resources
Library from `Resources`, filter chips for the four categories, format icons. Live count badge.

## FAQ / help library
Renders the `FAQ` sheet, grouped by category, searchable via universal search. Linked from the header help icon on every page, lives here.

## Triage tool (D10 — build after Insights ships)
Scope when reached: multi-step form → writes `Triage_Responses` → Apps Script (or the submit handler) computes score/strengths/weaknesses/recommended KPIs → updates the club's row → flips `triage_complete` → dashboard personalisation goes fully live. Resolve D1 first (reset timestamps interact with the Clubs row).

---

# Section 4 — Tools  *(docs/sections/04 merged here for brevity — split if it grows)*

- **Contact Us** — Action Pop-up variant, free, types: change request / suggestion / bug / help / rating. Logs + notifies like any pink action but costs 0.
- **Find** — straight integration of the existing NBRH Engine (embed or link-out with the club's area prefilled — **ask Kennedy which the Engine supports**). Not a rebuild.
- **Calendar** — read-only month view from `Events` + dated `Opportunities` rows (D6). Mobile: agenda list, not a squeezed grid. Empty month: "Nothing scheduled this month" + CTA to Opportunities.

---

# Section 5 — Services

Cards from the `Services` sheet: name, category, description, `hourly_rate_gbp` displayed prominently. "Get in touch" opens the Action Pop-up (free) → logged + notifies Kennedy with the service name. Categories: Monetisation, Social Media, Content Creation, Paid Social Media, Copywriting, Strategy Consultancy, Ad Hoc, Digital Infrastructure. Inactive services (`active` = FALSE) don't render.
