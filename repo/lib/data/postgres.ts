import { neon } from "@neondatabase/serverless";
import { LocalAdapter } from "./index";
import type { DataAdapter, SubmitActionInput, SubmitActionResult } from "./index";
import type { ActionLogRow } from "../types";

// @vercel/postgres is deprecated (Vercel moved Postgres to a native Neon
// integration) — using Neon's own actively-maintained driver instead,
// pointed at the same POSTGRES_URL Vercel already set when the database
// was connected to this project (Storage tab → Create Database → Postgres).
const sql = neon(process.env.POSTGRES_URL!);

/**
 * Postgres-backed adapter — Actions_Log / token ledger ONLY.
 *
 * Why this exists: LocalAdapter.submitAction() writes with fs.writeFile()
 * directly to data/actions_log.json. That works locally, but Vercel's
 * serverless functions run on a read-only filesystem in production — every
 * pink-button click on the deployed site was failing that write silently
 * (CLAUDE.md rule 10's graceful-failure message, "We couldn't log this",
 * was firing on every single real click, not just genuine outages).
 *
 * Everything else — clubs, players, sponsorships, resources, etc. — is
 * still reference data read from /data/*.json (and later Sheets), per
 * Kennedy's decision: reads stay on Sheets/local JSON, only data GENERATED
 * BY INTERACTION inside the OS (requests, the token ledger) moves to a real
 * database. So this class does NOT reimplement the whole DataAdapter — it
 * wraps a LocalAdapter for every read method that isn't ledger-related, and
 * only overrides the four that touch Actions_Log:
 *   - submitAction()       (the actual write)
 *   - getActionsForClub()  (a club's own history)
 *   - getTokenBalance()    (computed from the ledger, same formula as before)
 *   - getAllActions()      (Kennedy's admin datalog, app/admin/requests)
 *
 * Activated automatically in lib/data/index.ts's getAdapter() whenever
 * POSTGRES_URL exists (set automatically by Vercel once a Postgres database
 * is connected to this project — Storage tab → Create Database → Postgres).
 * No further env var needed; this doesn't require DATA_ADAPTER=sheets or
 * =local to be set, it layers on top of whichever of those is reading
 * everything else.
 *
 * Table is created on first use if it doesn't exist yet (see ensureTable())
 * rather than requiring a separate manual migration step — acceptable for
 * pilot scale; worth a real migration file if this repo ever adopts one.
 */

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = sql`
      CREATE TABLE IF NOT EXISTS actions_log (
        log_id TEXT PRIMARY KEY,
        idempotency_key TEXT UNIQUE NOT NULL,
        club_id TEXT NOT NULL,
        action_key TEXT NOT NULL,
        entry_id TEXT,
        token_cost INTEGER NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        notified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at TIMESTAMPTZ
      );
    `.then(() => undefined);
  }
  return tableReady;
}

function rowToActionLogRow(r: Record<string, unknown>): ActionLogRow {
  return {
    log_id: r.log_id as string,
    idempotency_key: r.idempotency_key as string,
    club_id: r.club_id as string,
    action_key: r.action_key as string,
    entry_id: (r.entry_id as string | null) ?? null,
    token_cost: Number(r.token_cost),
    type: r.type as ActionLogRow["type"],
    status: r.status as ActionLogRow["status"],
    notes: (r.notes as string) ?? "",
    notified: Boolean(r.notified),
    created_at: new Date(r.created_at as string).toISOString(),
    completed_at: r.completed_at ? new Date(r.completed_at as string).toISOString() : null,
  };
}

export class PostgresAdapter implements DataAdapter {
  private local = new LocalAdapter();

  // --- everything below just delegates to LocalAdapter — reference data
  // hasn't moved, only the ledger has (see file header) ---
  getClubByToken = this.local.getClubByToken.bind(this.local);
  getSponsorships = this.local.getSponsorships.bind(this.local);
  getOpportunities = this.local.getOpportunities.bind(this.local);
  getPlayers = this.local.getPlayers.bind(this.local);
  getPeople = this.local.getPeople.bind(this.local);
  getBrands = this.local.getBrands.bind(this.local);
  getInfluencers = this.local.getInfluencers.bind(this.local);
  getClubsDirectory = this.local.getClubsDirectory.bind(this.local);
  getResources = this.local.getResources.bind(this.local);
  getServices = this.local.getServices.bind(this.local);
  getPerks = this.local.getPerks.bind(this.local);
  getTrendingTopics = this.local.getTrendingTopics.bind(this.local);
  getFaq = this.local.getFaq.bind(this.local);
  getEvents = this.local.getEvents.bind(this.local);
  getTokensReference = this.local.getTokensReference.bind(this.local);
  getConfig = this.local.getConfig.bind(this.local);
  setClubPriorities = this.local.setClubPriorities.bind(this.local);
  dataAsOf = this.local.dataAsOf.bind(this.local);
  getPeerCompletenessScores = this.local.getPeerCompletenessScores.bind(this.local);
  getAllClubsForDirectory = this.local.getAllClubsForDirectory.bind(this.local);

  // --- the four ledger methods, now backed by Postgres ---

  async getActionsForClub(club_id: string): Promise<ActionLogRow[]> {
    await ensureTable();
    const rows = await sql`
      SELECT * FROM actions_log WHERE club_id = ${club_id} ORDER BY created_at DESC;
    `;
    return (rows as Record<string, unknown>[]).map(rowToActionLogRow);
  }

  async getAllActions(): Promise<ActionLogRow[]> {
    await ensureTable();
    const rows = await sql`SELECT * FROM actions_log ORDER BY created_at DESC;`;
    return (rows as Record<string, unknown>[]).map(rowToActionLogRow);
  }

  async getTokenBalance(club_id: string): Promise<{ balance: number; allocation: number }> {
    await ensureTable();
    // Same formula as LocalAdapter — ledger is truth, allocation + adjustments − action costs.
    const config = await this.getConfig();
    const allocation = Number(config["allocation_default"] ?? 10);
    const rows = (await sql`
      SELECT type, token_cost FROM actions_log
      WHERE club_id = ${club_id} AND status != 'cancelled';
    `) as Record<string, unknown>[];
    const spent = rows
      .filter((r) => r.type === "action")
      .reduce((n, r) => n + Number(r.token_cost), 0);
    const adjusted = rows
      .filter((r) => r.type === "adjustment")
      .reduce((n, r) => n + Number(r.token_cost), 0);
    return { balance: allocation + adjusted - spent, allocation };
  }

  async submitAction(input: SubmitActionInput): Promise<SubmitActionResult> {
    await ensureTable();

    // Idempotency: a retry or double-click can never deduct twice — same
    // contract as LocalAdapter, enforced here with a UNIQUE constraint plus
    // an existence check first so a genuine duplicate returns ok:true
    // rather than surfacing a constraint-violation error to the user.
    const existing = await sql`
      SELECT 1 FROM actions_log WHERE idempotency_key = ${input.idempotency_key};
    `;
    if (existing.length > 0) {
      const { balance } = await this.getTokenBalance(input.club_id);
      return { ok: true, duplicate: true, new_balance: balance };
    }

    const ref = (await this.getTokensReference()).find(
      (t) => t.action_key === input.action_key && t.active,
    );
    if (!ref) return { ok: false, duplicate: false, new_balance: 0, error: "Unknown action" };

    const log_id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      await sql`
        INSERT INTO actions_log
          (log_id, idempotency_key, club_id, action_key, entry_id, token_cost, type, status, notes, notified)
        VALUES
          (${log_id}, ${input.idempotency_key}, ${input.club_id}, ${input.action_key},
           ${input.entry_id ?? null}, ${ref.token_cost}, 'action', 'pending',
           ${input.notes ?? ""}, FALSE);
      `;
    } catch (err: unknown) {
      // A UNIQUE-constraint race (two near-simultaneous retries) lands here
      // rather than in the existence check above — treat it the same way,
      // as a duplicate, not a failure (CLAUDE.md rule 10: never a raw crash).
      const { balance } = await this.getTokenBalance(input.club_id);
      return { ok: true, duplicate: true, new_balance: balance };
    }

    const { balance } = await this.getTokenBalance(input.club_id);
    return { ok: true, duplicate: false, new_balance: balance };
  }

  async resetTokenBalance(club_id: string): Promise<{ balance: number; allocation: number }> {
    await ensureTable();
    const { balance, allocation } = await this.getTokenBalance(club_id);
    const shortfall = allocation - balance; // how many tokens to hand back
    if (shortfall > 0) {
      const log_id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await sql`
        INSERT INTO actions_log
          (log_id, idempotency_key, club_id, action_key, entry_id, token_cost, type, status, notes, notified)
        VALUES
          (${log_id}, ${`reset-${club_id}-${Date.now()}`}, ${club_id}, 'balance_reset',
           NULL, ${shortfall}, 'adjustment', 'complete',
           'Balance reset to full allocation (admin)', FALSE);
      `;
    }
    return this.getTokenBalance(club_id);
  }

  async setActionStatus(log_id: string, status: ActionLogRow["status"]): Promise<void> {
    await ensureTable();
    const completed_at = status === "complete" ? new Date().toISOString() : null;
    await sql`
      UPDATE actions_log
      SET status = ${status}, completed_at = ${completed_at}
      WHERE log_id = ${log_id};
    `;
  }

  async clearAllActions(): Promise<void> {
    await ensureTable();
    await sql`TRUNCATE TABLE actions_log;`;
  }
}
