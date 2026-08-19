import { getAdapter } from "@/lib/data";
import type {
  ActionLogRow,
  Brand,
  Club,
  ClubDirectoryEntry,
  Influencer,
  Person,
  Player,
  Sponsorship,
  TokenRef,
} from "@/lib/types";
import { ResetBalanceButton } from "@/components/reset-balance-button";
import { LoggedToggleButton } from "@/components/logged-toggle-button";

/**
 * Kennedy's private admin datalog. Lists every row ever written to
 * Actions_Log by submitOutreachAction()/submitFreeAction() (lib/actions.ts)
 * — across every club, not scoped to one. The write path that CREATES a
 * request is unchanged: every pink or black action a club takes already
 * lands here via the same ledger it always has (CLAUDE.md rule 7) — this
 * page is a second place that data is visible. Two admin-only actions live
 * here too: resetting a club's balance (appends an adjustment row) and
 * toggling a request's pending/logged status (edits that row's own status
 * field) — neither can affect a club's token_cost or fabricate a new
 * request; see resetClubTokenBalance()/toggleActionLogged() in lib/actions.ts.
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

/**
 * Resolves an ActionLogRow's action_key + entry_id into a human-readable
 * description of WHO/WHAT the request was actually for — the detail Kennedy
 * flagged was missing (e.g. "club_outreach" + entry_id alone doesn't say
 * which club). Maps each outreach action_key to the entity list it draws
 * from (data/tokens_reference.json's "section: outreach" keys), using the
 * SAME already-consent-gated reads (getPlayers/getPeople/etc, CLAUDE.md rule
 * 3) the rest of the app uses — never a second, ungated lookup. When a
 * Player/Person's name is null (no sharing consent), falls back to their
 * area/role rather than fabricating a name — the gate itself is respected,
 * not routed around.
 */
function resolveEntryDetail(
  row: ActionLogRow,
  lookups: {
    players: Map<string, Player>;
    people: Map<string, Person>;
    brands: Map<string, Brand>;
    influencers: Map<string, Influencer>;
    clubsDirectory: Map<string, ClubDirectoryEntry>;
    sponsorships: Map<string, Sponsorship>;
  },
): string | null {
  if (!row.entry_id) return null;
  switch (row.action_key) {
    case "player_invite": {
      const p = lookups.players.get(row.entry_id);
      if (!p) return null;
      return p.name ?? `Player in ${p.area} (name withheld — no sharing consent)`;
    }
    case "person_request": {
      const p = lookups.people.get(row.entry_id);
      if (!p) return null;
      return p.name ?? `${p.role} in ${p.area} (name withheld — no sharing consent)`;
    }
    case "brand_outreach_local":
    case "brand_outreach_corporate": {
      const b = lookups.brands.get(row.entry_id);
      return b?.name ?? null;
    }
    case "influencer_outreach": {
      const i = lookups.influencers.get(row.entry_id);
      return i?.name ?? null;
    }
    case "club_outreach": {
      const c = lookups.clubsDirectory.get(row.entry_id);
      return c?.name ?? null;
    }
    case "sponsorship_apply":
    case "sponsorship_apply_complex": {
      const s = lookups.sponsorships.get(row.entry_id);
      return s?.title ?? null;
    }
    default:
      return null; // contact_us / feature_request / service_enquiry / list_callout: detail already lives in notes
  }
}

export default async function AdminRequestsPage() {
  const db = getAdapter();
  const [actions, clubs, tokenRefs, players, people, brands, influencers, clubsDirectory, sponsorships] =
    await Promise.all([
      db.getAllActions(),
      db.getAllClubsForDirectory(),
      db.getTokensReference(),
      db.getPlayers(),
      db.getPeople(),
      db.getBrands(),
      db.getInfluencers(),
      db.getClubsDirectory(),
      db.getSponsorships(),
    ]);

  const balances = await Promise.all(
    clubs.map(async (c) => ({ club: c, ...(await db.getTokenBalance(c.club_id)) })),
  );

  const clubById = new Map<string, Club>(clubs.map((c) => [c.club_id, c]));
  const refByKey = new Map<string, TokenRef>(tokenRefs.map((t) => [t.action_key, t]));
  const lookups = {
    players: new Map(players.map((p) => [p.player_id, p])),
    people: new Map(people.map((p) => [p.person_id, p])),
    brands: new Map(brands.map((b) => [b.brand_id, b])),
    influencers: new Map(influencers.map((i) => [i.influencer_id, i])),
    clubsDirectory: new Map(clubsDirectory.map((c) => [c.directory_id, c])),
    sponsorships: new Map(sponsorships.map((s) => [s.opportunity_id, s])),
  };

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
          Every request submitted across every club, newest first.
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

        <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Club balances</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {balances.map(({ club, balance, allocation }) => (
            <div
              key={club.club_id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: "1.05rem" }}>{club.name}</div>
                <div style={{ color: "var(--dim)", fontSize: "0.85rem", marginTop: 2 }}>
                  {balance} / {allocation} tokens remaining
                </div>
              </div>
              <ResetBalanceButton
                clubId={club.club_id}
                clubName={club.name}
                balance={balance}
                allocation={allocation}
              />
            </div>
          ))}
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
              const detail = resolveEntryDetail(row, lookups);
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
                        {detail && (
                          <span style={{ color: "var(--pink)" }}> — {detail}</span>
                        )}
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
                      <LoggedToggleButton logId={row.log_id} status={row.status} />
                    </div>
                  </div>
                  {row.notes && (
                    <p style={{ marginTop: 10, marginBottom: 0, fontSize: "0.9rem" }}>{row.notes}</p>
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
