# Section 2 — Outreach

**Status: built.** Six subsections, one interaction pattern, all built from the Entry Card + Action Pop-up components. Every subsection uses the exact button colours and token costs specced below.

## The pattern (identical everywhere)
List view of entries → eye icon expands GDPR-safe detail (consent-gated by the data layer) → entry opens the Action Pop-up → black = self-serve external link (free) · pink = Kennedy acts (token cost on button, notification fires) → notes field + "Report an issue" on every form → full-screen sheet on mobile → live entry count in the header.

## Subsections
| Tab | Data | Actions (rows in Tokens_Reference) |
|---|---|---|
| Players | `Players` | Pink: send invite (1) |
| People | `People`, filterable by role | Pink: request this person (1) |
| Brands & Businesses | `Brands_Businesses` | Black: visit website · Pink: outreach on our behalf (1–2 by `type`) |
| Influencers | `Influencers` | Black: contact directly (`direct_contact_url`) · Pink: NBRH reaches out (1–2) |
| Sponsorship & Funding | `Sponsorship_Funding`, sorted by match score, shows amount + closing date | Black: apply yourself (`apply_url`) · Pink: NBRH applies for you (2–3) |
| Clubs | `Clubs_Directory` | Black: reach out yourself (`public_contact_url`) · Pink: NBRH arranges friendly/coffee (1–2) |

Variable costs (1–2, 2–3): store as distinct `Tokens_Reference` rows (e.g. `brand_outreach_local` = 1, `brand_outreach_corporate` = 2) selected by entry attributes — never ranges on a button. A button always shows one exact number.

## Empty states
- A tab with no entries yet: "No [players] listed in your area yet — we're adding more every week" + CTA to Contact Us.
- Pre-priorities club: lists still browsable, but match-sorted tabs fall back to closing-date/recency order with a banner CTA to set priorities.

## Section-specific QA
- Consent gating verified: a row with consent FALSE never renders name/contact anywhere, including in notifications sent to Kennedy? (No — Kennedy's notification MAY include contact data; the gate is club-facing only. Verify both directions.)
- Double-click on a pink button = one ledger row (idempotency)
- Zero-balance behaviour matches D1 exactly
