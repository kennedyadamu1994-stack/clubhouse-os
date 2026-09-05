import { neon } from "@neondatabase/serverless";
import { LocalAdapter } from "./index";
import type { DataAdapter, SubmitActionInput, SubmitActionResult } from "./index";
import type { ActionLogRow, InboxMessage } from "../types";

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

/**
 * Inbox read state (Kennedy's request, 27 Aug: persistent per-club
 * read/unread). Its own table, separate from actions_log, since it isn't
 * a ledger entry — no token_cost, no status lifecycle, just "has this
 * club seen this message". Message CONTENT stays in the (not yet built)
 * INBOX sheet, which Kennedy edits directly (CLAUDE.md rule 9) — this
 * table only ever stores which (club_id, message_id) pairs have been
 * read, never the message text itself, so his sheet edits and a club's
 * read clicks can never collide.
 */
let inboxReadsTableReady: Promise<void> | null = null;

function ensureInboxReadsTable(): Promise<void> {
  if (!inboxReadsTableReady) {
    inboxReadsTableReady = sql`
      CREATE TABLE IF NOT EXISTS inbox_reads (
        club_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (club_id, message_id)
      );
    `.then(() => undefined);
  }
  return inboxReadsTableReady;
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
  getClubTierById = this.local.getClubTierById.bind(this.local);
  getSponsorships = this.local.getSponsorships.bind(this.local);
  getOpportunities = this.local.getOpportunities.bind(this.local);
  getPlayers = this.local.getPlayers.bind(this.local);
  getPlayersUnfiltered = this.local.getPlayersUnfiltered.bind(this.local);
  getPeople = this.local.getPeople.bind(this.local);
  getBrands = this.local.getBrands.bind(this.local);
  getInfluencers = this.local.getInfluencers.bind(this.local);
  getClubsDirectory = this.local.getClubsDirectory.bind(this.local);
  getSuppliers = this.local.getSuppliers.bind(this.local);
  getSocialVenues = this.local.getSocialVenues.bind(this.local);
  getResources = this.local.getResources.bind(this.local);
  getServices = this.local.getServices.bind(this.local);
  getPlans = this.local.getPlans.bind(this.local);
  getPerks = this.local.getPerks.bind(this.local);
  getTrendingTopics = this.local.getTrendingTopics.bind(this.local);
  getHeaderImages = this.local.getHeaderImages.bind(this.local);
  getNbrhUpdates = this.local.getNbrhUpdates.bind(this.local);
  getFaq = this.local.getFaq.bind(this.local);
  getEvents = this.local.getEvents.bind(this.local);
  getTokensReference = this.local.getTokensReference.bind(this.local);
  getConfig = this.local.getConfig.bind(this.local);
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

  /**
   * Just the set of message_ids this club has read — split out from
   * getInboxMessages() below so SheetsAdapter can query read-state alone
   * without also triggering this.local's redundant content fetch (content
   * for a Sheets-backed club comes from the real INBOX tab instead, not
   * local seed data).
   */
  async getInboxReadIds(club_id: string): Promise<Set<string>> {
    await ensureInboxReadsTable();
    const rows = await sql`SELECT message_id FROM inbox_reads WHERE club_id = ${club_id};`;
    return new Set((rows as { message_id: string }[]).map((r) => r.message_id));
  }

  /**
   * Content comes from this.local (message text/subject/sent_at all live
   * in the not-yet-built INBOX sheet — LocalAdapter's seed JSON stands in
   * for it until then, same "seed data until a real sheet exists" pattern
   * used elsewhere in this codebase). Read state comes from THIS class's
   * own inbox_reads table, not LocalAdapter's — LocalAdapter's own
   * getInboxMessages() reads its own local JSON read-state file, which is
   * fine for local dev but isn't the persistent store Kennedy asked for
   * in production, so this override replaces that half specifically.
   */
  async getInboxMessages(club_id: string): Promise<(InboxMessage & { read: boolean })[]> {
    const [messages, readIds] = await Promise.all([
      this.local.getInboxMessages(club_id), // content + a read flag we're about to discard/replace
      this.getInboxReadIds(club_id),
    ]);
    return messages.map((m) => ({ ...m, read: readIds.has(m.message_id) }));
  }

  async getUnreadInboxCount(club_id: string): Promise<number> {
    const all = await this.getInboxMessages(club_id);
    return all.filter((m) => !m.read).length;
  }

  async markInboxMessageRead(club_id: string, message_id: string): Promise<void> {
    await ensureInboxReadsTable();
    // ON CONFLICT DO NOTHING — idempotent, same contract as the ledger's
    // own idempotency handling: marking an already-read message read
    // again is a no-op, not an error or a duplicate row (the primary key
    // is (club_id, message_id), so a second insert would otherwise throw).
    await sql`
      INSERT INTO inbox_reads (club_id, message_id)
      VALUES (${club_id}, ${message_id})
      ON CONFLICT (club_id, message_id) DO NOTHING;
    `;
  }

  async getTokenBalance(
    club_id: string,
    allocationOverride?: number,
  ): Promise<{ balance: number; allocation: number }> {
    await ensureTable();
    // Same formula as LocalAdapter — ledger is truth, allocation + adjustments − action costs.
    // allocationOverride (from SheetsAdapter, which has the real per-tier
    // allocation) takes priority — Config's allocation_default is now only
    // a fallback for when no override is supplied (e.g. this class used
    // standalone, without SheetsAdapter in front of it).
    let allocation = allocationOverride;
    if (allocation == null) {
      const config = await this.getConfig();
      // 10 here is a last-resort literal for the case where Config's own
      // allocation_default key is missing entirely — matches Free's real
      // allocation (5) would be more correct, but Config's own value (kept
      // at 5, reconciled 27 Aug) is checked first and is the one that
      // actually governs in practice.
      allocation = Number(config["allocation_default"] ?? 5);
    }
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
    // Floored at 0 (28 Aug — hard cap: "there can never be minus tokens").
    // submitAction's own check prevents this happening for anything logged
    // from now on, but this also protects against any pre-existing
    // over-spend already sitting in the ledger from before that check
    // existed — the raw historical rows are untouched, only the number
    // every part of the app treats as "what you have left" is clamped.
    return { balance: Math.max(0, allocation + adjusted - spent), allocation };
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
    if (!ref) return { ok: false, duplicate: false, new_balance: 0, error: "Unknown action", error_code: "unknown_action" };

    // Hard cap (28 Aug, Kennedy: "There is a hard cap on tokens. There can
    // never be minus tokens. The request will be denied.") — free actions
    // (token_cost 0, e.g. Contact Us) are never blocked regardless of
    // balance, since they cost nothing to begin with. This check and the
    // insert below aren't in one atomic transaction, so a genuinely
    // simultaneous double-click could in principle both pass this check
    // before either inserts — the pre-existing idempotency_key mechanism
    // above already prevents that specific case (same click, retried);
    // two truly distinct clicks racing past a near-zero balance is a real
    // but narrow edge case, not eliminated here, and would need a
    // DB-level transaction/lock to close completely.
    if (ref.token_cost > 0) {
      const { balance } = await this.getTokenBalance(input.club_id);
      if (balance < ref.token_cost) {
        return {
          ok: false,
          duplicate: false,
          new_balance: balance,
          error: `Not enough tokens — this costs ${ref.token_cost}, you have ${balance} left.`,
          error_code: "insufficient_tokens",
        };
      }
    }

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

  async resetTokenBalance(
    club_id: string,
    allocationOverride?: number,
  ): Promise<{ balance: number; allocation: number }> {
    await ensureTable();
    const { balance, allocation } = await this.getTokenBalance(club_id, allocationOverride);
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
    return this.getTokenBalance(club_id, allocationOverride);
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
