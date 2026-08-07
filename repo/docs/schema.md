# Database schema (Google Sheets)

⚠️ **Draft columns.** The spec defined tabs but not columns; Kennedy's real database doc wasn't available when this was written. **Step 2 begins by reconciling this file against the actual "ULTIMATE NBRH CLUB HOUSE OS DATABASE" — real columns win.** Update this file to match before writing the data layer.

Conventions: snake_case headers, row 1 = headers, no merged cells, dates as ISO `YYYY-MM-DD`, booleans as TRUE/FALSE, multi-value fields comma-separated tags.

## Clubs
`club_id` · `club_token` (auth, unguessable) · `name` · `sport` · `area` · `contact_name` · `contact_email` · `plan_tier` (core/premium) · `priorities` (tags, from onboarding) · `goals` · `kpis` (set by triage later) · `members_count` · `teams_count` · `locations` · `community_note` (Kennedy edits) · `header_image_url` (dashboard banner photo — Kennedy sets per club; blank falls back to a sport-appropriate stock image, never a hardcoded football photo for every sport) · `tokens_display` (cache only — ledger is truth) · `token_reset_at` (per D1) · `triage_complete` (bool) · `health_score` · `created_at`

## Players
`player_id` · `area` · `sports` (tags) · `interests` (tags) · `preferred_times` · `level` · `consent_share_name` (bool) · `consent_contact` (bool) · `name`* · `email`* · `created_at`
*Starred fields render **only** when the matching consent flag is TRUE — enforced in the data layer, not per component.

## People
**Reconciled against the real "PEOPLE" tab.** Real columns: `name,professional_type,primary_sport,location,image_url,bio,booking_url,website,experience_years,certifications,specialisation,Price_Per_Hour,availability,age_groups,user_rating,review_count,verified,active,record_id`. This tab has no per-row consent flag and no separate contact field — `name` is the identifying column; `booking_url`/`website` is the public-contact route. `person_id` maps to `record_id`, `role` maps to `professional_type`, `area` maps to `location`, `rate_note` maps to `Price_Per_Hour`.

## Brands_Businesses — ⚠️ no dedicated tab exists
There is no `Brands_Businesses` or `Influencers` tab in the real database — both were invented for the seed build before the real sheet was reconciled. The closest real equivalent is the **CLUBS** tab (`club_name,activity_type,location,image_url,club_snippet,club_bio,Website,instagram,audience,numeric_rating,monthly_fee_text,Verified?`), which Outreach → Clubs now reads directly. **Brands & Businesses and Influencers, as separate subsections, are not backed by a real tab** — until Kennedy adds one, both keep running on seed data with a visible "seed data — no live sheet yet" note rather than silently pretending they're wired to something real.

## Influencers — see note above (no dedicated tab; seed data only until a real source exists)

## Sponsorship_Funding
`opportunity_id` · `title` · `provider` · `amount` · `closing_date` · `eligibility_tags` · `sports` · `areas` · `apply_url` (black button target) · `description` · `created_at`

## Clubs_Directory — superseded by the real CLUBS tab
Outreach → Clubs reads `club_name, activity_type, location, image_url, audience, numeric_rating, page_url/booking_url` directly from the real **CLUBS** sheet, filtered to `active = yes`, rather than a separate directory tab.

## Opportunities
`opportunity_id` · `title` · `type` (workshop/event/pr/resource/callout) · `date` · `area` · `tags` · `link` · `description` · `submitted_by_club_id` (blank = Kennedy-listed) · `status` (open/closed) · `created_at`

## Resources
`resource_id` · `title` · `category` (marketing/strategy/digital/monetisation) · `format` (article/video/link/report) · `url` · `summary` · `created_at`

## Services
`service_id` · `name` · `category` · `description` · `hourly_rate_gbp` · `active` (bool)

## Events  *(new — feeds Calendar, D6)*
`event_id` · `title` · `date` · `end_date` · `area` · `type` · `link` · `notes`

## Actions_Log  *(append-only ledger — see architecture.md)*
`log_id` · `idempotency_key` · `club_id` · `action_key` (FK → Tokens_Reference) · `entry_id` (what it targeted) · `token_cost` (copied at time of action — costs can change later) · `type` (action/adjustment) · `status` (pending/complete/cancelled) · `notes` (club's free text) · `notified` (bool) · `created_at` · `completed_at`

## Tokens_Reference
`action_key` · `label` · `section` · `token_cost` · `button_colour` (black/pink) · `active` (bool) · `notes`

## Config  *(new — everything tunable without code)*
`key` · `value` — includes: match-score weights (D4), allocation_core, allocation_premium (D8, blank until pilot), cache minutes, contrast-adjusted pink text hex if needed.

## Triage_Responses  *(populated once D10 ships)*
`response_id` · `club_id` · `submitted_at` · `answers_json` · `score` · `strengths` · `weaknesses` · `recommended_kpis`

## FAQ  *(new — powers the in-product help library)*
`faq_id` · `question` · `answer` · `category` · `order`

## Core Sessions  *(external — NOT one of Club House OS's own tabs)*
Referenced by `components/session-insights.tsx` for the platform-wide block
at the bottom of Workspace → Insights. Lives in a separate Google Sheet
(ID `1v2ve0B1MWKQPu0CRIgl4jhtHRk88MoEA04T6IfhPE_o`), fetched client-side at
runtime via `opensheet.elk.sh` — not through this app's own `lib/data`
adapter, since it isn't club data and there's nothing to scope. Columns
used: `Activity Type` · `Location` · `Base Price (£)` · `Audience` ·
`User Rating` · `Duration (minutes)` · `Days` · `Session Status` ·
`Difficulty Level` · `Spots Available` · `Total Spots` ·
`Sportsmanship Score` · `Friendliness Score` · `Organisation Score`.
If this sheet's structure changes, `session-insights.tsx`'s `F` field map
is the one place to update.
