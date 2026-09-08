# Section 1 — Overview (the club's home page)

Build order: first. Also establishes the app shell — desktop sidebar, **mobile bottom tab bar** (5 tabs = 5 sections), header with token widget and universal search.

## Populated state (build against Demo Club A)
- Universal search bar (scope per architecture.md § Search)
- Club health score — labelled "Profile completeness" until triage exists (D10)
- KPI panel (from `Clubs.kpis`; pre-triage → empty state)
- Top 5 Recommendations panel with match scores, "See more" expansion. Recommendations = highest match scores across Sponsorship_Funding, Opportunities, and Players for this club.
- Recommended players strip · New opportunities strip
- Neighbourhood ranking (per Scoring; <5 clubs in area → "Not enough clubs nearby to rank yet")
- Action tracker: list from `Actions_Log` for this club (action, cost, status, date) + tokens used vs. allocation progress bar
- Community note: rendered from `Clubs.community_note` — plain text with line breaks, visibly styled as "A note from The NBRH"
- Current plan display (Core/Premium)
- Plan management: **deferred to late in the build (spec Step 8)** — until then, a "Change plan" button opens a simple get-in-touch form (free, logged, notifies Kennedy)

## Empty state (build against Demo Club B — this is most clubs' first five minutes)
Every panel above that depends on triage/priorities renders the Empty-state component: e.g. recommendations panel → "Complete your club triage to unlock personalised recommendations" + CTA. Until triage exists (D10), the CTA opens the priorities-capture form (short form writing `Clubs.priorities` — enough to power v1 matching without full triage). The action tracker's empty state points at Outreach: "Your actions will appear here — try your first outreach."

## Section-specific QA (beyond global DoD)
- Both demo clubs render correctly with zero code branches hardcoded to club names
- Search returns grouped results and is fully keyboard-navigable
- Token widget identical on every page and correct after an action completes
