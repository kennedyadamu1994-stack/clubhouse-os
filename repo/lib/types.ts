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
