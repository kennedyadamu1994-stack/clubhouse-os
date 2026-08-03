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

export interface Recommendation {
  kind: "sponsorship" | "opportunity" | "player";
  id: string;
  title: string;
  subtitle: string;
  score: number;
}
