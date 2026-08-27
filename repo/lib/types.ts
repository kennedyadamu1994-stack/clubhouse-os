/**
 * 5 tiers, ranked Free < Core < Core+ < Premium < Premium+ (Kennedy, 25 Aug).
 * Read from DASHBOARD (X) column H. Only exactly "free" triggers the
 * paywall (Workspace + Tools locked; Outreach's Players/Clubs/People
 * locked) — every paid tier (core/core_plus/premium/premium_plus) gets
 * full access. Services' Premium-discount feature also now applies to
 * core_plus and premium_plus, not just exact "premium".
 */
export type PlanTier = "free" | "core" | "core_plus" | "premium" | "premium_plus";

/** True for every tier except "free" — the single check the whole paywall system uses. */
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
}

export type PersonRole =
  | "coach"
  | "referee"
  | "photographer"
  | "videographer"
  | "statistician"
  | "graphic_designer"
  | "copywriter"
  | "pt";

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
 * New club-facing Inbox (Kennedy's request, 27 Aug) — correspondence and
 * updates from The NBRH to a specific club. Sourced from a not-yet-created
 * "INBOX" worksheet in the "CHOS Workspace" workbook; Kennedy's own words:
 * "it will be an inbox for all the clubs, and I'll need you to be able to
 * shift through the inbox and ensure that the right messages... go to the
 * right clubs" — each row is tagged with the club_id it's meant for, so
 * one shared sheet routes correctly to each club's own Inbox page.
 *
 * Content lives in the sheet (Kennedy edits it there, same admin-surface
 * pattern as every other hand-maintained tab per CLAUDE.md rule 9); read
 * state does NOT — see InboxReadState below for why that split exists.
 */
export interface InboxMessage {
  message_id: string;
  club_id: string;
  sent_at: string;
  subject: string;
  body: string;
  /** Optional link the message points to (e.g. a resource, a form) — same optional-link pattern as Opportunity.link. */
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
 * New Outreach subsection (Kennedy's request, 27 Aug) — a hub for social
 * venues (pubs, function rooms, community halls clubs might use for
 * post-match socials, presentation nights, fundraisers). No real
 * worksheet exists yet — Kennedy's own words: "I haven't created the
 * worksheet yet, but it will be called 'SOCIAL VENUES'" in "THE ULTIMATE
 * NBRH CLUB HOUSE OS DATABASE" workbook. Built now as a placeholder
 * mirroring ClubDirectoryEntry's shape exactly, per Kennedy's explicit
 * instruction — swap in real column names once the sheet exists, same
 * reconciliation pattern already used for every other entity in this
 * file. `venue_type` takes the place ClubDirectoryEntry gives to `sport`
 * (a social venue has a type of venue, not a sport) and there's no
 * `total_teams` equivalent since venues aren't sports clubs.
 */
export interface SocialVenue {
  venue_id: string;
  created_at: string;
  sponsored: boolean;
  name: string;
  venue_type: string;
  area: string;
  open_to: string[];
  public_contact_url: string;
  image_url: string | null;
  bio: string | null;
  fee_text: string | null;
  email: string | null;
  instagram_url: string | null;
  website_url: string | null;
  address: string | null;
  verified: boolean;
  gallery_image_urls: string[];
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
 * Kennedy's request, 25 Aug: real action button per recommendation, not
 * just a badge — "funding + opportunities only for now, since those are
 * the only types currently scored" (his words; players' matchScore did
 * technically compute, but he asked for it dropped from this list, so it
 * is). action_key/entry_id/token_cost mirror what each entry's own
 * Outreach page already uses for its pink/black action buttons — same
 * action_key values, so submitting from here writes to the ledger exactly
 * like submitting from the full Outreach page would.
 */
export interface Recommendation {
  kind: "sponsorship" | "opportunity";
  id: string;
  title: string;
  subtitle: string;
  score: number;
  action_key: string;
  action_label: string;
  token_cost: number;
  /** Only set for opportunities with a real listing link — used for the free "view" action, same as the Opportunities page. */
  view_url?: string;
}
