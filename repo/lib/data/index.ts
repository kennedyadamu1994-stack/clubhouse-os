import { promises as fs } from "fs";
import path from "path";
import type {
  ActionLogRow,
  Brand,
  Club,
  ClubDirectoryEntry,
  Event,
  Faq,
  Influencer,
  Opportunity,
  Perk,
  Person,
  Player,
  Resource,
  Service,
  Sponsorship,
  TokenRef,
  TrendingTopic,
} from "../types";
import type { ScoreWeights } from "../scoring";

/**
 * Data-access layer — the ONLY module the app talks to for data.
 * Server-side only. Every read is scoped by club; the client never
 * receives another club's rows (CLAUDE.md rule 1).
 *
 * Adapter is chosen by DATA_ADAPTER env var:
 *   "local"  — reads /data/*.json (seed data; default; what this repo runs on today)
 *   "sheets" — Google Sheets API (lib/data/sheets.ts — scaffolded, needs credentials)
 */

export interface SubmitActionInput {
  club_id: string;
  action_key: string;
  entry_id?: string;
  notes?: string;
  idempotency_key: string;
}

export interface SubmitActionResult {
  ok: boolean;
  duplicate: boolean;
  new_balance: number;
  error?: string;
}

export interface DataAdapter {
  getClubByToken(token: string): Promise<Club | null>;
  getSponsorships(): Promise<Sponsorship[]>;
  getOpportunities(): Promise<Opportunity[]>;
  getPlayers(): Promise<Player[]>;
  getPeople(): Promise<Person[]>;
  getBrands(): Promise<Brand[]>;
  getInfluencers(): Promise<Influencer[]>;
  getClubsDirectory(): Promise<ClubDirectoryEntry[]>;
  getResources(): Promise<Resource[]>;
  getServices(): Promise<Service[]>;
  getPerks(): Promise<Perk[]>;
  getTrendingTopics(): Promise<TrendingTopic[]>;
  getFaq(): Promise<Faq[]>;
  getEvents(): Promise<Event[]>;
  getActionsForClub(club_id: string): Promise<ActionLogRow[]>;
  getTokenBalance(club_id: string): Promise<{ balance: number; allocation: number }>;
  getTokensReference(): Promise<TokenRef[]>;
  getConfig(): Promise<Record<string, string>>;
  submitAction(input: SubmitActionInput): Promise<SubmitActionResult>;

  dataAsOf(): Promise<string>;
  /**
   * Aggregate-only cross-club comparison for Workspace → Insights' comparison
   * table (docs/sections 03-05 § Insights: "comparison table vs. clubs with
   * the same sport/area — aggregate stats only, never another club's
   * identifiable data"). Returns ONLY profileCompleteness scores for other
   * clubs sharing this club's sport AND area — no names, no contact info, no
   * other fields. Intentionally separate from getAllClubsForDirectory(),
   * which returns full rows and must never be reachable from a real club's
   * pages. Note: this is NOT architecture.md's area-only "neighbourhood
   * ranking" (a different, Overview-spec'd, not-yet-built feature) — see
   * lib/scoring.ts peerComparison() for why the two are kept separate.
   */
  getPeerCompletenessScores(club_id: string, sport: string, area: string): Promise<number[]>;
  /**
   * The ONE deliberate exception to "every read is scoped by club" (CLAUDE.md
   * rule 1). Powers the pilot-only club directory at app/page.tsx so Kennedy
   * can test without memorising tokens. Never call this from anywhere a real
   * club could reach — it returns every club's row.
   */
  getAllClubsForDirectory(): Promise<Club[]>;
  /**
   * A second deliberate exception to CLAUDE.md rule 1, same shape as
   * getAllClubsForDirectory() above. Powers Kennedy's private admin datalog
   * at app/admin/requests — every Actions_Log row across every club, newest
   * first. Not linked from anywhere in the club-facing app; never call this
   * from a route a real club can reach.
   */
  getAllActions(): Promise<ActionLogRow[]>;
  /**
   * A deliberate exception to the never-show-player-names rule (20 Aug:
   * "Only I will ever see the request data log... seeing names is okay").
   * Returns Players WITHOUT gatePlayer()'s always-null-name treatment —
   * real names, when the sheet has one. Powers ONLY Kennedy's private admin
   * datalog at app/admin/requests, so he knows who to actually reach out
   * to for a pending player_invite request. Never call this from any route
   * a real club or player could reach — getPlayers() (the gated version)
   * remains the only path for everything club-facing.
   */
  getPlayersUnfiltered(): Promise<Player[]>;
  /**
   * Kennedy's admin-only "reset balance" action (app/admin/requests). Writes
   * a single `type: "adjustment"` row sized to exactly cancel out whatever
   * that club has spent so far — never edits or deletes existing rows
   * (CLAUDE.md rule 7: never edit a balance cell in place; ledger is truth).
   * History stays fully intact; only the computed balance changes. Returns
   * the new balance. No-ops (adjustment of 0) if the club is already at
   * full allocation, so calling it twice in a row is harmless.
   */
  resetTokenBalance(club_id: string): Promise<{ balance: number; allocation: number }>;
  /**
   * Kennedy's admin-only "mark as logged" action (app/admin/requests). Flips
   * a single Actions_Log row's status field — pending → complete, or back.
   * Never touches token_cost/type/created_at, so it can't affect a club's
   * balance (CLAUDE.md rule 7: balance is computed from the ledger; this
   * only changes what's already the row's own status field, not a separate
   * "logged" flag layered on top). Throws if log_id doesn't exist.
   */
  setActionStatus(log_id: string, status: ActionLogRow["status"]): Promise<void>;
  /**
   * Kennedy's admin-only "clear all data logs" action (app/admin/requests).
   * Deletes EVERY row in Actions_Log — every club's request history AND,
   * as an unavoidable side effect, every club's token balance (balance is
   * computed from the ledger, so an empty ledger means every club shows
   * full allocation again). This is the one deliberate exception to
   * "Actions_Log is append-only" alongside setActionStatus() — a full wipe,
   * not a correction. Irreversible. The confirmation UI lives in the
   * component that calls this, not here.
   */
  clearAllActions(): Promise<void>;
}

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
  return JSON.parse(raw) as T;
}

/**
 * GDPR gates live HERE, not in components (CLAUDE.md rule 3): names/contact
 * details are stripped unless the row's consent flag is TRUE. Components never
 * decide what's safe to show — they just render whatever this layer gives them.
 */
export function gatePlayer(p: Player): Player {
  // Player names are NEVER shown, full stop — not conditional on
  // consent_share_name (Kennedy, 20 Aug: "Never under any circumstance
  // show the player's real name"). Stricter than gatePerson below, which
  // is the correct behaviour for People (professionals) — the two are
  // deliberately different rules, not a shared helper, so a future change
  // to one can't accidentally leak into the other.
  return { ...p, name: null };
}
function gatePerson(p: Person): Person {
  return { ...p, name: p.consent_share_name ? p.name : null };
}
function gateBrand(b: Brand): Brand {
  return { ...b, contact: b.consent_contact ? b.contact : null };
}

export class LocalAdapter implements DataAdapter {
  async getClubByToken(token: string) {
    const clubs = await readJson<Club[]>("clubs.json");
    return clubs.find((c) => c.club_token === token) ?? null;
  }
  async getSponsorships() {
    return readJson<Sponsorship[]>("sponsorship_funding.json");
  }
  async getOpportunities() {
    return readJson<Opportunity[]>("opportunities.json");
  }
  async getPlayers() {
    return (await readJson<Player[]>("players.json")).map(gatePlayer);
  }
  async getPlayersUnfiltered() {
    return readJson<Player[]>("players.json"); // no gatePlayer() — see interface doc comment
  }
  async getPeople() {
    return (await readJson<Person[]>("people.json")).map(gatePerson);
  }
  async getBrands() {
    return (await readJson<Brand[]>("brands.json")).map(gateBrand);
  }
  async getInfluencers() {
    // Influencers only ever list their own public direct_contact_url — no separate
    // private contact field exists, so there's nothing to gate here.
    return readJson<Influencer[]>("influencers.json");
  }
  async getClubsDirectory() {
    return readJson<ClubDirectoryEntry[]>("clubs_directory.json");
  }
  async getResources() {
    return readJson<Resource[]>("resources.json");
  }
  async getServices() {
    return readJson<Service[]>("services.json");
  }
  async getPerks() {
    return readJson<Perk[]>("perks.json");
  }
  async getTrendingTopics() {
    const rows = await readJson<TrendingTopic[]>("trending.json");
    // Newest first — same as a real news feed would present.
    return rows.sort((a, b) => b.published_at.localeCompare(a.published_at));
  }
  async getFaq() {
    const rows = await readJson<Faq[]>("faq.json");
    return rows.sort((a, b) => a.order - b.order);
  }
  async getEvents() {
    return readJson<Event[]>("events.json");
  }
  async getPeerCompletenessScores(club_id: string, sport: string, area: string) {
    const clubs = await readJson<Club[]>("clubs.json");
    const { profileCompleteness } = await import("../scoring");
    return clubs
      .filter((c) => c.club_id !== club_id && c.sport === sport && c.area === area)
      .map((c) => profileCompleteness(c));
  }
  async getActionsForClub(club_id: string) {
    const log = await readJson<ActionLogRow[]>("actions_log.json");
    return log
      .filter((r) => r.club_id === club_id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  async getTokenBalance(club_id: string) {
    // Ledger is truth (CLAUDE.md rule 7): allocation + adjustments − action costs.
    const [log, config] = await Promise.all([
      readJson<ActionLogRow[]>("actions_log.json"),
      this.getConfig(),
    ]);
    const allocation = Number(config["allocation_default"] ?? 10);
    const rows = log.filter((r) => r.club_id === club_id && r.status !== "cancelled");
    const spent = rows.filter((r) => r.type === "action").reduce((n, r) => n + r.token_cost, 0);
    const adjusted = rows.filter((r) => r.type === "adjustment").reduce((n, r) => n + r.token_cost, 0);
    return { balance: allocation + adjusted - spent, allocation };
  }
  async getTokensReference() {
    return readJson<TokenRef[]>("tokens_reference.json");
  }
  async getConfig() {
    const rows = await readJson<{ key: string; value: string }[]>("config.json");
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
  async submitAction(input: SubmitActionInput): Promise<SubmitActionResult> {
    const file = path.join(DATA_DIR, "actions_log.json");
    const log = await readJson<ActionLogRow[]>("actions_log.json");

    // Idempotency: a retry or double-click can never deduct twice.
    if (log.some((r) => r.idempotency_key === input.idempotency_key)) {
      const { balance } = await this.getTokenBalance(input.club_id);
      return { ok: true, duplicate: true, new_balance: balance };
    }

    const ref = (await this.getTokensReference()).find(
      (t) => t.action_key === input.action_key && t.active,
    );
    if (!ref) return { ok: false, duplicate: false, new_balance: 0, error: "Unknown action" };

    const row: ActionLogRow = {
      log_id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      idempotency_key: input.idempotency_key,
      club_id: input.club_id,
      action_key: input.action_key,
      entry_id: input.entry_id ?? null,
      token_cost: ref.token_cost, // cost copied at time of action — reference values can change later
      type: "action",
      status: "pending",
      notes: input.notes ?? "",
      notified: false, // Apps Script sweep re-sends anything unnotified (architecture.md § Notifications)
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    log.push(row);
    await fs.writeFile(file, JSON.stringify(log, null, 2));
    const { balance } = await this.getTokenBalance(input.club_id);
    return { ok: true, duplicate: false, new_balance: balance };
  }
  async setActionStatus(log_id: string, status: ActionLogRow["status"]) {
    const file = path.join(DATA_DIR, "actions_log.json");
    const log = await readJson<ActionLogRow[]>("actions_log.json");
    const row = log.find((r) => r.log_id === log_id);
    if (!row) throw new Error("Action not found");
    row.status = status;
    row.completed_at = status === "complete" ? new Date().toISOString() : null;
    await fs.writeFile(file, JSON.stringify(log, null, 2));
  }
  async clearAllActions() {
    const file = path.join(DATA_DIR, "actions_log.json");
    await fs.writeFile(file, JSON.stringify([], null, 2));
  }
  async dataAsOf() {
    return new Date().toISOString(); // local reads are always live; Sheets adapter returns cache time
  }
  async getAllClubsForDirectory() {
    return readJson<Club[]>("clubs.json");
  }
  async getAllActions() {
    const log = await readJson<ActionLogRow[]>("actions_log.json");
    return log.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  async resetTokenBalance(club_id: string) {
    const file = path.join(DATA_DIR, "actions_log.json");
    const log = await readJson<ActionLogRow[]>("actions_log.json");
    const { balance, allocation } = await this.getTokenBalance(club_id);
    const shortfall = allocation - balance; // how many tokens to hand back
    if (shortfall > 0) {
      const row: ActionLogRow = {
        log_id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        idempotency_key: `reset-${club_id}-${Date.now()}`,
        club_id,
        action_key: "balance_reset",
        entry_id: null,
        token_cost: shortfall, // positive — getTokenBalance() adds "adjustment" rows back in
        type: "adjustment",
        status: "complete",
        notes: "Balance reset to full allocation (admin)",
        notified: false,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
      log.push(row);
      await fs.writeFile(file, JSON.stringify(log, null, 2));
    }
    return this.getTokenBalance(club_id);
  }
}

export function getAdapter(): DataAdapter {
  // Two independent axes, not one:
  //   1. Reference data (clubs, players, sponsorships, etc.) — Local or
  //      Sheets, chosen by whether Google Sheets credentials exist.
  //   2. The ledger (Actions_Log / token balance) — always Postgres once
  //      POSTGRES_URL exists, regardless of which reference-data source is
  //      active. This used to be one combined switch (POSTGRES_URL →
  //      PostgresAdapter for everything), which was correct back when
  //      Sheets wasn't wired up — now that SheetsAdapter exists and needs
  //      the ledger too, that old switch would have silently routed
  //      reference-data reads through PostgresAdapter's LocalAdapter
  //      fallback even with real Sheets credentials present. Fixed 20 Aug.
  const hasSheetsCredentials =
    Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) &&
    Boolean(process.env.GOOGLE_PRIVATE_KEY) &&
    Boolean(process.env.GOOGLE_SHEET_ID_MASTER) &&
    Boolean(process.env.GOOGLE_SHEET_ID_WORKSPACE);

  if (hasSheetsCredentials) {
    const { SheetsAdapter } = require("./sheets") as typeof import("./sheets");
    return new SheetsAdapter(); // already delegates the ledger to PostgresAdapter internally
  }
  if (process.env.POSTGRES_URL) {
    const { PostgresAdapter } = require("./postgres") as typeof import("./postgres");
    return new PostgresAdapter(); // reference data from Local, ledger from Postgres
  }
  return new LocalAdapter();
}

export async function getScoreWeights(): Promise<ScoreWeights> {
  const c = await getAdapter().getConfig();
  return {
    sport: Number(c["weight_sport"] ?? 30),
    area: Number(c["weight_area"] ?? 25),
    tag: Number(c["weight_tag"] ?? 10),
    tagCap: Number(c["weight_tag_cap"] ?? 30),
    urgency: Number(c["weight_urgency"] ?? 15),
  };
}
