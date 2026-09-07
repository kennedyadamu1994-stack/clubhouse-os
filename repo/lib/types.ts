/**
 * 5 tiers, ranked Free < Core < Core+ < Premium < Premium+ (Kennedy, 25 Aug).
 * Read from DASHBOARD (X) column H. Only exactly "free" triggers the
 * paywall. As of 1 Sep: Workspace and Tools are hidden entirely for Free
 * (reversing the 27 Aug "no paywalls" decision); Outreach stays visible
 * for Free but only its Players, Clubs, and Sponsorship & Funding
 * subsections — People, Brands & Businesses, Influencers, Suppliers, and
 * Social Venues are hidden. Every paid tier (core/core_plus/premium/
 * premium_plus) gets full access to everything. Services' Premium-discount
 * feature also applies to core_plus and premium_plus, not just exact
 * "premium". See app/dashboard/[clubToken]/{workspace,tools,outreach}/
 * layout.tsx and the individual Outreach subsection pages for where this
 * is actually enforced (nav hiding AND route-level notFound() guards).
 */
export type PlanTier = "free" | "core" | "core_plus" | "premium" | "premium_plus";

/** True for every tier except "free" — kept as a general-purpose check, though Workspace/Tools/Outreach gating (1 Sep) now checks `plan_tier === "free"` directly at each call site rather than through this helper, since the gate is "hide entirely", not "grey out". */
export function hasPaidAccess(tier: PlanTier): boolean {
  return tier !== "free";
}

/** True for core_plus, premium, and premium_plus — used by Services' discount feature. */
export function getsServiceDiscount(tier: PlanTier): boolean {
  return tier === "core_plus" || tier === "premium" || tier === "premium_plus";
}

/** Human-readable label for each tier — the one place this mapping lives. */
export const PLAN_TIER_LABEL: Record<PlanTier, string> = {
  free: "Free",
  core: "Core",
  core_plus: "Core+",
  premium: "Premium",
  premium_plus: "Premium+",
};

/**
 * One club KPI, with its target (Kennedy's request, 20 Aug: "show what
 * they have and what the corresponding target is, so they can see what
 * they're working towards"). value/target are the raw strings from the
 * sheet (may be numbers, £ amounts, %, etc.) — kept as strings rather than
 * parsed to number since not every KPI value is numeric, and formatting
 * varies per KPI.
 */
export interface KpiEntry {
  name: string;
  value: string | null;
  target: string | null;
}

/**
 * One row from CHOS Workspace's real PLAN sheet — Kennedy's request, 25 Aug:
 * wire the Membership "Your plan" box to this real sheet instead of
 * hardcoded pricing/perks. price is the raw sheet text (e.g. "£35") since
 * not every plan necessarily has a numeric price (Free). perks is
 * PERK 1-11 columns, filtered to non-blank. tokens is the new column N
 * ("TOKENS") — the real per-plan monthly token allocation.
 */
export interface PlanDetails {
  tier: PlanTier;
  price: string;
  perks: string[];
  tokens: number;
}

export interface ConnectedPage {
  label: string;
  url: string;
}

export interface ClubHealth {
  awareness: number;
  user_reviews: number;
  nbrh_quality: number;
  management: number;
  digital_infrastructure: number;
}

export interface Club {
  club_id: string;
  club_token: string;
  name: string;
  sport: string;
  area: string;
  contact_name: string;
  contact_email: string;
  plan_tier: PlanTier;
  goals: string;
  kpis: KpiEntry[];
  members_count: number | null;
  teams_count: number | null;
  header_image_url: string | null;
  logo_url: string | null;
  triage_complete: boolean;
  created_at: string;
  /**
   * Dedicated pages this club already has elsewhere (a booking/session page,
   * a club profile page, a league page). Powers the Connected Pages section
   * in Overview (Kennedy's request, 19 Aug). Eventually sourced from
   * 'THE ULTIMATE NBRH CLUB HOUSE OS DATABASE' → DASHBOARD (X) sheet — for
   * now, seeded per-club in data/clubs.json since only one demo club has
   * real URLs to show. Absent or empty array = section doesn't render for
   * that club, never a placeholder/dead link (CLAUDE.md rule 4).
   */
  connected_pages?: ConnectedPage[];
  /**
   * Five-part health breakdown from DASHBOARD (X)'s real CHP1-5 columns
   * (Awareness/User Reviews/NBRH Quality/Management/Dig-Infra, columns
   * AD-AH). Powers the Club Health box on Overview (Kennedy's request, 20
   * Aug — replaces the old "Profile completeness" box entirely). Optional
   * because the local/demo adapter has no equivalent seed data yet — when
   * absent, the Club Health box falls back to the old completeness-based
   * display rather than showing broken/zeroed bars.
   */
  club_health?: ClubHealth;
  /**
   * Real "Sector Ranking" (column W) and "Sector/Category (for ranking
   * comparison)" (column X) on DASHBOARD (X) — Kennedy's request: shown
   * in the Club Health section alongside Overall club health, same
   * design and size. Optional for the same reason as club_health — the
   * local/demo adapter has no equivalent seed data yet. sector_ranking
   * is the club's real numeric position within its sector (1 = best);
   * sector_category is the real sector/category text it's being ranked
   * within (e.g. "Grassroots Football, London").
   */
  sector_ranking?: number | null;
  sector_category?: string | null;
  /**
   * The club's own match-scoring tags — DASHBOARD (X)'s new real "Tags"
   * column (Kennedy, 29 Aug), added specifically so every entity's match
   * score has something real on the club's side to compare against. Uses
   * a DASH separator ("Basketball - Female - London"), not commas like
   * every other tags field in the app — parsed with toDashList(), not
   * toList(), and filtered through the same filterContextualTags() as
   * every other entity's tags. Optional because this column is brand new
   * and older/local seed data won't have it yet — an empty array means
   * every match score against this club is 0%, not an error, since the
   * scoring formula divides by the club's own tag count.
   */
  tags: string[];
}

export interface Sponsorship {
  opportunity_id: string;
  created_at: string;
  sponsored: boolean;
  title: string;
  provider: string;
  amount: string;
  closing_date: string;
  eligibility_tags: string[];
  sports: string[];
  areas: string[];
  apply_url: string;
  description: string;
  image_url: string | null;
  /**
   * Real "tags" column on SPONSORSHIPS/FUNDING — deliberately separate
   * from eligibility_tags above, which reads a different real column
   * ("Eligibility Criteria") and powers existing filter/search UI that
   * predates this field. This one exists purely for match scoring
   * (Kennedy, 29 Aug) — never shown as filter chips or in the detail panel.
   */
  tags: string[];
  /**
   * Real "credibility_score" column, SPONSORSHIPS/FUNDING (6 Sep,
   * Kennedy's universal star rating request). 1 (poor) to 5 (excellent),
   * half-points allowed. Null when unset — no stars shown, never a
   * misleading 0.
   */
  credibility_score: number | null;
}

export interface Opportunity {
  opportunity_id: string;
  title: string;
  type: "workshop" | "event" | "pr" | "resource" | "callout";
  date: string;
  area: string;
  tags: string[];
  link: string;
  description: string;
  submitted_by_club_id: string | null;
  status: "open" | "closed";
}

export interface Player {
  player_id: string;
  created_at: string;
  sponsored: boolean;
  area: string;
  sports: string[];
  interests: string[];
  preferred_times: string;
  level: string;
  consent_share_name: boolean;
  name: string | null;
  /** From NEIGHBOURS (O)'s real Gender column. Shown on the anonymised card (Kennedy's decision, 20 Aug) — name still never shown, but gender/age now are. */
  gender: string | null;
  /** From NEIGHBOURS (O)'s real Age column. Same visibility decision as gender. */
  age: number | null;
  /**
   * NEIGHBOURS (O)'s real "tags" column (comma-separated, filtered via
   * filterContextualTags() to strip IDs/URLs/numbers) — the basis for
   * this player's match score against a club's own Tags (Kennedy, 29
   * Aug: rebuilding match scoring around real tags columns everywhere).
   */
  tags: string[];
  /**
   * Real "credibility_score" column, NEIGHBOURS (O) (6 Sep, Kennedy:
   * "a universal star system... represent the quality of the data").
   * 1 (poor) to 5 (excellent), half-points allowed. Null when a row has
   * no value set — rendered as no stars at all, never a misleading 0.
   */
  credibility_score: number | null;
}

/**
 * The 8 named values are autocomplete hints for the roles Kennedy
 * originally anticipated — NOT an exhaustive list. Real PEOPLE sheet
 * rows can and do contain other professional_type values (confirmed
 * 29 Aug, when a new row crashed the whole People page because
 * ROLE_LABEL[p.role] assumed every role would be one of these 8 and
 * returned undefined for the new one). The `(string & {})` union keeps
 * these 8 suggested in editor autocomplete while still honestly typing
 * this as "any string" — every consumer of Person.role must treat an
 * unrecognised value as a real, expected case, not an impossible one.
 */
export type PersonRole =
  | "coach"
  | "referee"
  | "photographer"
  | "videographer"
  | "statistician"
  | "graphic_designer"
  | "copywriter"
  | "pt"
  | (string & {});

export interface Person {
  person_id: string;
  created_at: string;
  sponsored: boolean;
  role: PersonRole;
  area: string;
  sports: string[];
  availability: string;
  rate_note: string;
  consent_share_name: boolean;
  name: string | null;
  image_url: string | null;
  /**
   * Real "verified" column on the PEOPLE sheet (confirmed in
   * docs/schema.md's real-column reconciliation) — never mapped into
   * this type before 29 Aug (Kennedy: "their original data sources
   * might have a column that say these data points are verified... can
   * you implement a verified badge"). CONTENT CREATORS (the other real
   * source feeding getPeople()) has no confirmed equivalent column, so
   * rows from that sheet default this to false rather than guessing.
   */
  verified: boolean;
  /**
   * Real "booking_url"/"website" columns on the PEOPLE sheet — documented
   * in docs/schema.md's column reconciliation back on 20 Aug ("booking_url
   * /website is the public-contact route") but never actually wired into
   * this type or the People page until 29 Aug, when Kennedy asked for the
   * black self-serve button back. Empty string when neither column is
   * filled in for a row (CONTENT CREATORS rows always have this empty —
   * no confirmed equivalent column on that sheet).
   */
  direct_contact_url: string;
  /**
   * Real "credibility_score" column, PEOPLE sheet (6 Sep, Kennedy's
   * universal star rating request). 1 (poor) to 5 (excellent),
   * half-points allowed. Null when unset — no stars shown. CONTENT
   * CREATORS rows have no confirmed equivalent column, same pattern as
   * verified/direct_contact_url above, so those default to null too.
   */
  credibility_score: number | null;
  /** PEOPLE/CONTENT CREATORS' real "tags" column — see Player.tags doc comment for the full reasoning. */
  tags: string[];
}

export interface Brand {
  brand_id: string;
  created_at: string;
  sponsored: boolean;
  name: string;
  type: "local_shop" | "big_brand" | "corporate";
  area: string;
  sectors: string[];
  partnership_interests: string[];
  website: string;
  consent_contact: boolean;
  contact: string | null;
  image_url: string | null;
  /** BRANDS/BUSINESSES' real "tags" column — see Player.tags doc comment for the full reasoning. */
  tags: string[];
  /** Real "credibility_score" column, BRANDS/BUSINESSES (6 Sep, Kennedy's universal star rating request). 1 (poor) to 5 (excellent), half-points allowed. Null when unset. */
  credibility_score: number | null;
}

export interface Influencer {
  influencer_id: string;
  created_at: string;
  sponsored: boolean;
  name: string;
  area: string;
  platforms: string[];
  follower_band: string;
  niches: string[];
  direct_contact_url: string;
  consent_contact: boolean;
  image_url: string | null;
  /** INFLUENCERS' real "tags" column — see Player.tags doc comment for the full reasoning. */
  tags: string[];
  /** Real "credibility_score" column, INFLUENCERS (6 Sep, Kennedy's universal star rating request). 1 (poor) to 5 (excellent), half-points allowed. Null when unset. */
  credibility_score: number | null;
}

export interface ClubDirectoryEntry {
  directory_id: string;
  created_at: string;
  sponsored: boolean;
  name: string;
  sport: string;
  area: string;
  open_to: string[];
  public_contact_url: string;
  image_url: string | null;
  /**
   * Expanded detail fields (Kennedy's request, 25 Aug: "showcase even more
   * of the club's info when it expands") — all real columns on the Club
   * Hub sheet, previously fetched but unused. Every field is optional
   * since not every real club row fills in every column.
   */
  bio: string | null;
  fee_text: string | null;
  email: string | null;
  instagram_url: string | null;
  website_url: string | null;
  address: string | null;
  verified: boolean;
  total_teams: number | null;
  gallery_image_urls: string[];
  /** Club Hub sheet's real "tags" column — see Player.tags doc comment for the full reasoning. */
  tags: string[];
  /** Real "credibility_score" column, Club Hub sheet (6 Sep, Kennedy's universal star rating request). 1 (poor) to 5 (excellent), half-points allowed. Null when unset. */
  credibility_score: number | null;
}

/**
 * New Outreach subsection (Kennedy's request, 27 Aug), sourced from the
 * real "KIT" worksheet in "THE ULTIMATE NBRH CLUB HOUSE OS DATABASE"
 * workbook. Every field below maps directly to a real column Kennedy
 * provided — field names normalised to this app's snake_case convention,
 * the sheet's own header text is noted per field since several don't
 * translate 1:1 (e.g. "PREMIUM/CORE" → plan_gated, "U notes" → internal_notes).
 *
 * plan_gated (from "PREMIUM/CORE"): true when this supplier is
 * paid-tier-only, following the same pattern as the Outreach layout's
 * LOCKED_SLUGS — Suppliers as a whole subsection is locked on Free
 * (matching Brands/Influencers/Sponsorship's precedent, since suppliers
 * are a commercial-partner category, not a Players/People/Clubs one).
 *
 * internal_notes (from "U notes"): Kennedy's own private notes on this
 * supplier — never rendered on the club-facing card, kept here only so
 * the field exists if an internal admin view ever needs it.
 *
 * credibility_score/verification_status: shown as a small trust
 * indicator on the card, same pattern as ClubDirectoryEntry.verified.
 */
export interface Supplier {
  supplier_id: string; // "Entity ID"
  record_id: string;
  name: string; // "Supplier Name"
  product_categories: string[]; // "Product Categories"
  brands_carried: string[]; // "Brands Carried"
  price_tier: string; // "Price Tier"
  bulk_discount: string | null; // "Bulk/Team Discount"
  customization_offered: string | null; // "Customization Offered"
  sustainability_credentials: string | null; // "Sustainability Credentials"
  safeguarding_compliance: string | null; // "Safeguarding Compliance"
  sample_available: boolean; // "Sample Available"
  lead_time: string | null; // "Lead Time"
  minimum_order: string | null; // "Minimum Order"
  delivery_area: string; // "Delivery Area"
  contact: string | null; // "Contact"
  past_grassroots_clients: string | null; // "Past Grassroots Clients"
  image_url: string | null; // "Image URL"
  created_at: string; // "date_added"
  last_updated: string | null; // "last_updated"
  added_by: string | null; // "added_by"
  source_url: string | null; // "source_url"
  credibility_score: number | null; // "credibility_score"
  verification_status: string | null; // "verification_status"
  tags: string[]; // "tags"
  /** Kennedy's own private notes ("U notes") — never shown to clubs. */
  internal_notes: string | null;
  plan_gated: boolean; // "PREMIUM/CORE"
  sponsored: boolean; // "SPONSORED?"
}

/**
 * New club-facing Inbox — correspondence and updates from The NBRH to a
 * specific club. Sourced from the real "INBOX" worksheet in the "CHOS
 * Workspace" workbook (sheet confirmed created, 27 Aug follow-up).
 * Kennedy's real columns: Entry ID, Date, Club, Message, URL — simpler
 * than first assumed: one combined message body (no separate subject
 * line), and routing is by the CLUB'S NAME (Kennedy confirmed, 27 Aug
 * follow-up — "Club" holds e.g. "Hackney Marshes FC", not a Club ID
 * code), not by club_id. This is a real fragility worth flagging: unlike
 * every other entity in this app, which routes by a stable ID, a message
 * routes by matching Club.name — an exact-match, case-insensitive
 * comparison; a renamed club or a typo in the sheet means a message
 * silently doesn't reach anyone rather than erroring, since there's no
 * way to distinguish "no messages for this club" from "the name didn't
 * match" from the club's side.
 *
 * Content lives in the sheet (Kennedy edits it there, same admin-surface
 * pattern as every other hand-maintained tab per CLAUDE.md rule 9); read
 * state does NOT — see InboxReadState below for why that split exists.
 */
export interface InboxMessage {
  message_id: string; // "Entry ID"
  club_id: string; // resolved server-side — prefers the real "Club ID" column (5 Sep security fix), falls back to matching "Club" (a name) against Club.name for rows that predate that column
  sent_at: string; // "Date"
  /** "Title" column, added by Kennedy 27 Aug follow-up — resolves the earlier "no separate subject line" limitation. Falls back to a truncated preview of the message if a row predates this column. */
  title: string;
  message: string; // "Message"
  /** Optional link the message points to (e.g. a resource, a form). "URL" column. */
  link: string | null;
}

/**
 * Per-club, per-message read state. Kept OUT of the Inbox sheet and in
 * Postgres instead, alongside Actions_Log (Kennedy's requirement, 27 Aug:
 * "persistent" read/unread) — a Sheet is a poor fit for state that
 * changes on every click from every club simultaneously (the same
 * reasoning Actions_Log already uses the ledger/Postgres split for), and
 * routing through Kennedy's own hand-edited content sheet would risk a
 * club's read click clobbering his edits or vice versa. The sheet stays
 * the single source of truth for message CONTENT; this tracks only
 * whether a given club has read a given message.
 */
export interface InboxReadState {
  club_id: string;
  message_id: string;
  read_at: string;
}

/**
 * New Outreach subsection (Kennedy's request, 27 Aug originally; real
 * sheet confirmed created 27 Aug follow-up) — a hub for social venues
 * (pubs, function rooms, community halls clubs might use for post-match
 * socials, presentation nights, fundraisers). Sourced from the real
 * "SOCIAL VENUE" worksheet in "THE ULTIMATE NBRH CLUB HOUSE OS DATABASE"
 * workbook — every field below maps directly to a real column Kennedy
 * provided, replacing the earlier placeholder that mirrored
 * ClubDirectoryEntry's shape before this sheet existed.
 *
 * "Column 55" is one of Kennedy's own listed headers, with no other name
 * given — kept as an untyped passthrough (raw string) rather than
 * guessed at or dropped, since inventing a meaning for an unlabeled
 * column risks silently hiding real data Kennedy may still define.
 *
 * plan_gated/internal_notes/credibility_score/verification_status follow
 * the exact same pattern as Supplier (same PREMIUM/CORE, U notes,
 * credibility_score, verification_status columns) — see that interface's
 * doc comment for the reasoning, identical here.
 */
export interface SocialVenue {
  venue_id: string; // "Entity ID"
  record_id: string;
  name: string; // "venue_name"
  venue_type: string;
  address_line_1: string | null;
  address_line_2: string | null;
  postcode: string | null;
  borough: string | null;
  latitude: number | null;
  longitude: number | null;
  nearest_station: string | null;
  booking_required: boolean;
  walk_ins_allowed: boolean;
  price_band: string | null;
  website_url: string | null;
  booking_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  instagram_handle: string | null;
  rating: number | null;
  verified_by_nbrh: boolean;
  venue_description_short: string | null;
  venue_description_long: string | null;
  best_for: string[];
  hero_image_url: string | null;
  /** Unlabeled column on the real sheet — see doc comment above. */
  column_55: string | null;
  created_at: string; // "date_added"
  last_updated: string | null;
  added_by: string | null;
  source_url: string | null;
  credibility_score: number | null;
  verification_status: string | null;
  tags: string[];
  /** Kennedy's own private notes ("U notes") — never rendered club-facing, same as Supplier.internal_notes. */
  internal_notes: string | null;
  plan_gated: boolean; // "PREMIUM/CORE"
  sponsored: boolean; // "SPONSORED?"
}

export interface ActionLogRow {
  log_id: string;
  idempotency_key: string;
  club_id: string;
  action_key: string;
  entry_id: string | null;
  token_cost: number;
  type: "action" | "adjustment";
  status: "pending" | "complete" | "cancelled";
  notes: string;
  notified: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface TokenRef {
  action_key: string;
  label: string;
  section: string;
  token_cost: number;
  button_colour: "black" | "pink";
  active: boolean;
}

export type ResourceCategory = "marketing" | "strategy" | "digital" | "monetisation";
export type ResourceFormat = "article" | "video" | "link" | "report";

export interface Resource {
  resource_id: string;
  title: string;
  category: ResourceCategory;
  format: ResourceFormat;
  url: string;
  summary: string;
  created_at: string;
}

export interface Faq {
  faq_id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface Event {
  event_id: string;
  title: string;
  date: string;
  end_date: string | null;
  area: string;
  type: string;
  link: string;
  notes: string;
}

export type ServiceCategory =
  | "monetisation"
  | "social_media"
  | "content_creation"
  | "paid_social_media"
  | "copywriting"
  | "strategy_consultancy"
  | "ad_hoc"
  | "digital_infrastructure";

export interface Service {
  service_id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  hourly_rate_gbp: number;
  active: boolean;
  created_at: string;
  /**
   * Premium-tier hourly rate, when discounted from hourly_rate_gbp. From
   * SERVICES' real "Discount if on Premium Plan" column (20 Aug reconciliation) —
   * Kennedy asked for this wired in as a genuine feature, not left unused.
   * null = no discount for this service; the Services page shows the
   * discounted rate only to clubs on the Premium plan, standard rate to Core.
   */
  premium_hourly_rate_gbp: number | null;
  /**
   * Real "Offer #1" through "Offer #5" columns (E-I on SERVICES, per
   * Kennedy, 29 Aug: "5 columns that detail the offer in that
   * service... can these offers per service be shown on their cards").
   * Free-text, one bullet per offer — a service with fewer than 5 real
   * offers filled in just has a shorter array, not 5 padded slots.
   */
  offers: string[];
}

export type PerkCategory =
  | "equipment"
  | "food_drink"
  | "software"
  | "training"
  | "travel"
  | "wellbeing";

export interface Perk {
  perk_id: string;
  partner: string;
  title: string;
  category: PerkCategory;
  description: string;
  offer: string;
  redeem_code: string | null;
  redeem_url: string;
  plan_tiers: PlanTier[];
  active: boolean;
  created_at: string;
}

export type TrendingCategory =
  | "funding"
  | "grassroots"
  | "marketing"
  | "policy"
  | "community"
  | "digital";

/**
 * News / Forum-Social / Event / Discussion-Op-ed — from Kennedy's Trending
 * Topics Desk reference component (19 Aug). Distinct from `category` above:
 * category is the club-relevant topic area (funding, marketing, etc.),
 * source_type is what kind of thing published it. Both are kept — source_type
 * drives the new filter/sort controls, category still labels the chip.
 */
export type TrendingSourceType = "news" | "forum" | "event" | "discussion";

export interface ContentAngle {
  title: string;
  medium: string;
}

/**
 * One row from CHOS Workspace's real "FROM THE NBRH" tab (Date, Note,
 * URL columns — Kennedy confirmed 25 Aug: Note is column B, URL is column
 * C, URL may be blank). Platform-wide feed, not per-club — every club
 * sees the same updates, same pattern as TrendingTopic/Resource/Faq below.
 * All rows are shown as a feed (Kennedy's decision, 25 Aug), not just the
 * latest one.
 */
export interface NbrhUpdate {
  update_id: string;
  date: string;
  note: string;
  url: string | null;
}

export interface TrendingTopic {
  topic_id: string;
  headline: string;
  source: string;
  category: TrendingCategory;
  source_type: TrendingSourceType;
  summary: string;
  why_it_matters: string;
  url: string;
  published_at: string;
  /**
   * Buzz-score inputs, 0-100 each (Kennedy's reference component). Trending
   * = recency/momentum signal; interest = novelty/stakes/conversation value.
   * Combined 50/50 into a single score band shown on the card. Currently
   * dummy data set by hand per story; the eventual Google Sheet becomes the
   * real source (Kennedy, 19 Aug: "in future this pulls from a Google
   * Sheet").
   */
  trending_score: number;
  interest_score: number;
  /** Original suggested content idea for the club's own use — never part of the source reporting itself. */
  content_angle: ContentAngle;
  /** Same image at both sizes via responsive CSS (object-fit + srcset-free scaling) rather than two separate assets — simpler to seed/maintain and still reads well on mobile and desktop. */
  thumbnail_url: string;
}

/**
 * Overview's header carousel banner (Kennedy's request, 2 Sep): reads
 * from CHOS Workspace's real "HEADER" tab so Kennedy can add/reorder/swap
 * banner images himself without a code change, replacing the earlier
 * hardcoded DEMO_CAROUSEL_IMAGES array in lib/header-image.ts. Platform-
 * wide, not per-club (Kennedy confirmed, 2 Sep) — every club sees the
 * same carousel. Real columns: "Header Order" (A, sort key), "Image URL"
 * (B), "URL" (C, optional click-through link for that slide).
 */
export interface HeaderImage {
  /** Row position — used only to sort the carousel into the intended order, never shown. */
  order: number;
  image_url: string;
  /** Optional click-through — clicking that carousel slide navigates here. Null when the slide isn't meant to be clickable. */
  url: string | null;
}

/**
 * Kennedy's request, 25 Aug: real action button per recommendation, not
 * just a badge — "funding + opportunities only for now, since those are
 * the only types currently scored" (his words; players' matchScore did
 * technically compute, but he asked for it dropped from this list, so it
 * is). action_key/entry_id/token_cost mirror what each entry's own
 * Outreach page already uses for its pink/black action buttons — same
 * action_key values, so submitting from here writes to the ledger exactly
 * like submitting from the full Outreach page would.
 *
 * `chips` replaces the old numeric `score` (removed 1 Sep with the v3
 * relevance rebuild, then rebuilt again same day onto the 4-bucket chip
 * system) — every recommendation here already has 2+ matching chips
 * (topRecommendations in lib/scoring.ts filters to that minimum), so
 * `chips` is never empty in practice, but is typed as a plain array
 * rather than importing ReasonChip from lib/relevance.ts, to avoid a
 * types.ts <-> relevance.ts import cycle (relevance.ts already imports
 * Club from this file). Shape is kept identical to ReasonChip by hand.
 */
export interface Recommendation {
  kind: "sponsorship" | "opportunity";
  id: string;
  title: string;
  subtitle: string;
  chips: { label: string; bucket: "sport" | "location" | "audience" | "gender" }[];
  action_key: string;
  action_label: string;
  token_cost: number;
  /** Only set for opportunities with a real listing link — used for the free "view" action, same as the Opportunities page. */
  view_url?: string;
}
