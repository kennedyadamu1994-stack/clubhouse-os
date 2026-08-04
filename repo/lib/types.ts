export type PlanTier = "core" | "premium";

export interface Club {
  club_id: string;
  club_token: string;
  name: string;
  sport: string;
  area: string;
  contact_name: string;
  contact_email: string;
  plan_tier: PlanTier;
  priorities: string[];
  goals: string;
  kpis: string[];
  members_count: number | null;
  teams_count: number | null;
  community_note: string;
  header_image_url: string | null;
  triage_complete: boolean;
  created_at: string;
}

export interface Sponsorship {
  opportunity_id: string;
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
  area: string;
  sports: string[];
  interests: string[];
  preferred_times: string;
  level: string;
  consent_share_name: boolean;
  name: string | null;
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
  name: string;
  sport: string;
  area: string;
  open_to: string[];
  public_contact_url: string;
  image_url: string | null;
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

export interface Recommendation {
  kind: "sponsorship" | "opportunity" | "player";
  id: string;
  title: string;
  subtitle: string;
  score: number;
}
