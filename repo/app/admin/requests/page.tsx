import { getAdapter } from "@/lib/data";
import type { ActionLogRow, Club, TokenRef } from "@/lib/types";

/**
 * Kennedy's private admin datalog. Lists every row ever written to
 * Actions_Log by submitOutreachAction()/submitFreeAction() (lib/actions.ts)
 * — across every club, not scoped to one. This is a read-only view; nothing
 * on this page writes anything. The write path is unchanged: every pink or
 * black action a club takes already lands here via the same ledger it always
 * has (CLAUDE.md rule 7) — this page is just a second place that data is
 * visible, not a new place it's created.
 *
 * Deliberately NOT linked from anywhere in the club-facing app (no nav item,
 * no shared layout with app/dashboard). Lives entirely outside
 * app/dashboard/[clubToken] on purpose — see CLAUDE.md rule 9's intent
 * (keep club-facing surface area unchanged) and DECISIONS.md D7 (this is not
 * the Sheets migration; it's a second read of the same ledger data).
 *
 * No auth gate yet — same pilot-stage posture as /directory. Add one before
 * a second person could ever land on this URL.
 */

const STATUS_LABEL: Record<ActionLogRow["status"], string> = {
  pending: "Pending",
  complete: "Complete",
  cancelled: "Cancelled",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminRequestsPage() {
  const db = getAdapter();
  const [actions, clubs, tokenRefs] = await Promise.all([
    db.getAllActions(),
    db.getAllClubsForDirectory(),
    db.getTokensReference(),
  ]);

  const clubById = new Map<string, Club>(clubs.map((c) => [c.club_id, c]));
  const refByKey = new Map<string, TokenRef>(tokenRefs.map((t) => [t.action_key, t]));

  const pendingCount = actions.filter((a) => a.status === "pending").length;
  const totalTokens = actions
    .filter((a) => a.type === "action" && a.status !== "cancelled")
    .reduce((sum, a) => sum + a.token_cost, 0);

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>
          Requests <em style={{ color: "var(--pink)", fontStyle: "normal" }}>Datalog</em>
        </h1>
        <p style={{ color: "var(--dim)", marginBottom: 24, fontSize: "0.9rem" }}>
          Every request submitted across every club, newest first. Read-only — nothing here
          writes to the ledger.
        </p>

        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          <div className="card" style={{ flex: "1 1 160px" }}>
            <div style={{ color: "var(--dim)", fontSize: "0.8rem", marginBottom: 4 }}>
              Total requests
            </div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: "1.6rem" }}>
              {actions.length}
            </div>
          </div>
          <div className="card" style={{ flex: "1 1 160px" }}>
            <div style={{ color: "var(--dim)", fontSize: "0.8rem", marginBottom: 4 }}>
              Pending
            </div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: "1.6rem", color: "var(--pink)" }}>
              {pendingCount}
            </div>
          </div>
          <div className="card" style={{ flex: "1 1 160px" }}>
            <div style={{ color: "var(--dim)", fontSize: "0.8rem", marginBottom: 4 }}>
              Tokens spent
            </div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: "1.6rem" }}>
              {totalTokens}
            </div>
          </div>
        </div>

        {actions.length === 0 ? (
          <div className="card" style={{ color: "var(--dim)" }}>
            No requests submitted yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {actions.map((row) => {
              const club = clubById.get(row.club_id);
              const ref = refByKey.get(row.action_key);
              return (
                <div key={row.log_id} className="card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: "1.05rem" }}>
                        {ref?.label ?? row.action_key}
                      </div>
                      <div style={{ color: "var(--dim)", fontSize: "0.85rem", marginTop: 2 }}>
                        {club?.name ?? row.club_id} · {formatTimestamp(row.created_at)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span className="badge">{STATUS_LABEL[row.status]}</span>
                      <span
                        className="badge"
                        style={{
                          color: "var(--text)",
                          background: "var(--surface-2)",
                          borderColor: "var(--line-strong)",
                        }}
                      >
                        {row.token_cost === 0 ? "Free" : `${row.token_cost} token${row.token_cost === 1 ? "" : "s"}`}
                      </span>
                      {!row.notified && (
                        <span
                          className="badge"
                          style={{ color: "var(--pink)", borderColor: "var(--pink-line)" }}
                        >
                          Not yet notified
                        </span>
                      )}
                    </div>
                  </div>
                  {row.notes && (
                    <p style={{ marginTop: 10, marginBottom: 0, fontSize: "0.9rem" }}>{row.notes}</p>
                  )}
                  {row.entry_id && (
                    <div style={{ color: "var(--faint-text)", fontSize: "0.78rem", marginTop: 8 }}>
                      Entry: {row.entry_id}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
