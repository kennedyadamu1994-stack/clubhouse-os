import { getAdapter } from "@/lib/data";
import { requireAdminOrRedirect } from "@/lib/auth/guard";
import { SignOutButton } from "@/components/sign-out-button";
import { PaginatedList } from "@/components/paginated-list";

/**
 * Player Contact Us / Request a Feature submissions (16 Sep, Kennedy:
 * "connect contact page to datalog"). A separate, simple page from
 * CHOS's own real admin requests datalog (app/admin/requests/page.tsx)
 * — that page is built entirely around club Actions_Log rows (token
 * cost, pending/complete status, entry lookups across nine different
 * real entities) that a player submission has none of; merging the two
 * would mean bolting player-shaped data onto a table and UI designed
 * for something genuinely different. Reads the real NOTIFICATIONS
 * sheet (getPlayerNotifications, filtered to player-originated rows —
 * see that method's own doc comment, lib/data/sheets.ts) — the same
 * real sheet notifyKennedyOfAction already writes every submission
 * into, just never read back anywhere until now.
 *
 * Same real admin login gate as the club requests page — genuinely
 * shared infrastructure (requireAdminOrRedirect), not a separate auth
 * system for this one page.
 */
export default async function PlayerRequests() {
  await requireAdminOrRedirect();
  const db = getAdapter();
  const notifications = await db.getPlayerNotifications();

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ marginBottom: 8 }}>
              Player <em style={{ color: "var(--pink)", fontStyle: "normal" }}>Requests</em>
            </h1>
            <p style={{ color: "var(--dim)", fontSize: "0.9rem" }}>
              Contact Us and Request a Feature submissions from POS, newest first.
            </p>
          </div>
          <SignOutButton />
        </div>

        {notifications.length === 0 ? (
          <div className="card" style={{ padding: 24 }}>
            <p style={{ color: "var(--dim)", fontSize: "0.9rem" }}>No player submissions yet.</p>
          </div>
        ) : (
          <PaginatedList
            className="entry-list"
            items={notifications.map((n, i) => (
              <div key={i} className="card" style={{ padding: 20, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                  <span className="chip">{n.action}</span>
                  <span style={{ color: "var(--dim)", fontSize: "0.8rem" }}>
                    {new Date(n.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--dim)", marginBottom: 8 }}>{n.from}</p>
                <p style={{ fontSize: "0.92rem" }}>{n.notes}</p>
              </div>
            ))}
          />
        )}
      </div>
    </main>
  );
}
