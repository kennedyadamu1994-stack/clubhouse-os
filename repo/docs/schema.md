# Database schema (Google Sheets)

⚠️ **Draft columns.** The spec defined tabs but not columns; Kennedy's real database doc wasn't available when this was written. **Step 2 begins by reconciling this file against the actual "ULTIMATE NBRH CLUB HOUSE OS DATABASE" — real columns win.** Update this file to match before writing the data layer.

Conventions: snake_case headers, row 1 = headers, no merged cells, dates as ISO `YYYY-MM-DD`, booleans as TRUE/FALSE, multi-value fields comma-separated tags.

## Clubs
`club_id` · `club_token` (auth, unguessable) · `name` · `sport` · `area` · `contact_name` · `contact_email` · `plan_tier` (core/premium) · `priorities` (tags, from onboarding) · `goals` · `kpis` (set by triage later) · `members_count` · `teams_count` · `locations` · `community_note` (Kennedy edits) · `header_image_url` (dashboard banner photo — Kennedy sets per club; blank falls back to a sport-appropriate stock image, never a hardcoded football photo for every sport) · `tokens_display` (cache only — ledger is truth) · `token_reset_at` (per D1) · `triage_complete` (bool) · `health_score` · `created_at`

## Players
`player_id` · `area` · `sports` (tags) · `interests` (tags) · `preferred_times` · `level` · `consent_share_name` (bool) · `consent_contact` (bool) · `name`* · `email`* · `created_at`
*Starred fields render **only** when the matching consent flag is TRUE — enforced in the data layer, not per component.

## People
`person_id` · `role` (coach/ref/photographer/videographer/statistician/graphic_designer/copywriter/pt) · `area` · `sports` · `availability` · `rate_note` · `consent_share_name` · `name`* · `contact`* · `created_at`

## Brands_Businesses
`brand_id` · `name` · `type` (local_shop/big_brand/corporate) · `area` · `sectors` (tags) · `partnership_interests` (tags) · `contact`* · `consent_contact` · `website` · `created_at`

## Influencers
`influencer_id` · `name` · `area` · `platforms` · `follower_band` · `niches` (tags) · `direct_contact_url` (black button target) · `consent_contact` · `created_at`

## Sponsorship_Funding
`opportunity_id` · `title` · `provider` · `amount` · `closing_date` · `eligibility_tags` · `sports` · `areas` · `apply_url` (black button target) · `description` · `created_at`

## Clubs_Directory
`directory_id` · `name` · `sport` · `area` · `open_to` (friendly/coffee/shared_training tags) · `public_contact_url` · `created_at`
(Separate tab from Clubs so non-member clubs can be listed; member clubs may appear in both.)

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
