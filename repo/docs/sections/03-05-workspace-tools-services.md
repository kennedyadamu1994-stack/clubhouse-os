# Section 3 — Workspace

## Insights
**Confirmed (4 Aug) — the "existing expanded Insights page" is a standalone HTML tool Kennedy had built separately: platform-wide session data (price, ratings, capacity, popularity across every NBRH session), fetched client-side from a public sheet, not club-scoped.** It's been ported into `components/session-insights.tsx` onto this app's design tokens and sits at the bottom of the Insights page as general context — the same for every club. Above it, a NEW club-specific section (built from this spec, not reused from anywhere) shows: comparison table vs. clubs with the same `sport`/`area` (aggregate stats only — never another club's identifiable data), improvement advice, and the entry point to the triage tool (D10; until built, links to the priorities-capture form). The two are visually and structurally distinct — club-specific first, platform-wide below — so a club doesn't mistake general platform numbers for something personalised to them.

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

# Section 4 — Tools  *(built 4 Aug — docs/sections/04 merged here for brevity)*

- **Contact Us** — its own small modal (`components/contact-us-form.tsx`), not a variant of the shared Action Pop-up — that component's UI is a row of black/pink option buttons, which doesn't fit a type-selector form. Types: change request / suggestion / bug / help / rating. Reuses the same `contact_us` action key already registered in `data/tokens_reference.json` at 0 tokens, and the same ledger pipeline (`submitFreeAction`) as every other action, so it's consistent under the hood even though its form shape differs.
- **Find** — **resolved (4 Aug):** checked thenbrh.co.uk directly; the NBRH Engine is a widget embedded inline on that page, not a standalone tool with its own embeddable URL or a prefill parameter. Kennedy confirmed: link out to thenbrh.co.uk in a new tab. If the Engine gets a real standalone URL later, `app/dashboard/[clubToken]/tools/find/page.tsx` is the one place to upgrade it.
- **Calendar** — built against D6's v1 proposal (Opportunities + a new `Events` tab). Month grid on desktop; an agenda list — not a squeezed grid — on mobile, same markup gated by the existing 780px breakpoint. Empty month: "Nothing scheduled this month" + CTA to Opportunities, per spec.

**Known gap, not introduced by this build:** the original Overview spec (docs/sections/01-overview.md) calls for a universal search bar and the Tools/Workspace docs assume a "header help icon" linking to FAQ — neither exists yet in `app/dashboard/[clubToken]/layout.tsx`. Worth scoping as its own piece of work rather than building ad hoc inside whichever section happens to need it next.

---

# Section 5 — Services

Cards from the `Services` sheet: name, category, description, `hourly_rate_gbp` displayed prominently. "Get in touch" opens the Action Pop-up (free) → logged + notifies Kennedy with the service name. Categories: Monetisation, Social Media, Content Creation, Paid Social Media, Copywriting, Strategy Consultancy, Ad Hoc, Digital Infrastructure. Inactive services (`active` = FALSE) don't render.
