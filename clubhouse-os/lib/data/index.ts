import { promises as fs } from "fs";
import path from "path";
import type { ActionLogRow, Club, Opportunity, Player, Sponsorship, TokenRef } from "../types";
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
  getActionsForClub(club_id: string): Promise<ActionLogRow[]>;
  getTokenBalance(club_id: string): Promise<{ balance: number; allocation: number }>;
  getTokensReference(): Promise<TokenRef[]>;
  getConfig(): Promise<Record<string, string>>;
  submitAction(input: SubmitActionInput): Promise<SubmitActionResult>;
  setClubPriorities(club_id: string, priorities: string[], goals: string): Promise<void>;
  dataAsOf(): Promise<string>;
}

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
  return JSON.parse(raw) as T;
}

/** GDPR gate lives HERE, not in components: names stripped unless consented. */
function gatePlayer(p: Player): Player {
  return { ...p, name: p.consent_share_name ? p.name : null };
}

class LocalAdapter implements DataAdapter {
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
  async setClubPriorities(club_id: string, priorities: string[], goals: string) {
    const file = path.join(DATA_DIR, "clubs.json");
    const clubs = await readJson<Club[]>("clubs.json");
    const club = clubs.find((c) => c.club_id === club_id);
    if (!club) throw new Error("Club not found");
    club.priorities = priorities;
    if (goals) club.goals = goals;
    await fs.writeFile(file, JSON.stringify(clubs, null, 2));
  }
  async dataAsOf() {
    return new Date().toISOString(); // local reads are always live; Sheets adapter returns cache time
  }
}

export function getAdapter(): DataAdapter {
  // Swap point for the Sheets adapter (lib/data/sheets.ts) once credentials exist.
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
