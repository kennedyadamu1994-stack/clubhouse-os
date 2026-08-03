import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { profileCompleteness, topRecommendations } from "@/lib/scoring";
import { EmptyState } from "@/components/empty-state";

export default async function Overview({ params }: { params: Promise<{ clubToken: string }> }) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [weights, sponsorships, opportunities, players, actions, asOf, balanceInfo] =
    await Promise.all([
      getScoreWeights(),
      db.getSponsorships(),
      db.getOpportunities(),
      db.getPlayers(),
      db.getActionsForClub(club.club_id),
      db.dataAsOf(),
      db.getTokenBalance(club.club_id),
    ]);

  const completeness = profileCompleteness(club);
  const recs = topRecommendations(club, sponsorships, opportunities, players, weights);
  const spent = actions
    .filter((a) => a.type === "action" && a.status !== "cancelled")
    .reduce((n, a) => n + a.token_cost, 0);
  const base = `/dashboard/${clubToken}`;

  return (
    <>
      <div className="grid">
        {/* Profile completeness — interim metric, honestly labelled until triage exists (D10) */}
        <section className="card" aria-labelledby="h-completeness">
          <h2 id="h-completeness">Profile completeness</h2>
          <div className="stat">{completeness}%</div>
          <p className="stat-label">
            {club.triage_complete
              ? "Based on your club triage."
              : "Your full club health score arrives with the club triage — coming later in the pilot."}
          </p>
        </section>

        {/* KPIs */}
        <section className="card" aria-labelledby="h-kpis">
          <h2 id="h-kpis">Your KPIs</h2>
          {club.kpis.length > 0 ? (
            <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
              {club.kpis.map((k) => (
                <li key={k} className="rec" style={{ padding: "8px 0" }}>
                  <span className="rec-title">{k}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              message="Tell us your priorities and we'll recommend the KPIs worth tracking."
              cta="Set your priorities"
              href={`${base}/priorities`}
            />
          )}
        </section>

        {/* Top 5 recommendations with match scores */}
        <section className="card span2" aria-labelledby="h-recs">
          <h2 id="h-recs">
            Top recommendations
            {recs.length > 0 && <span className="count-badge">matched to your goals</span>}
          </h2>
          {recs.length > 0 ? (
            <div>
              {recs.map((r) => (
                <div className="rec" key={`${r.kind}-${r.id}`}>
                  <span
                    className="match"
                    title="How closely this matches your club's sport, area, and priorities"
                  >
                    {r.score}
                  </span>
                  <div className="rec-body">
                    <div className="rec-title">{r.title}</div>
                    <div className="rec-sub">{r.subtitle}</div>
                  </div>
                  <span className="kind">{r.kind}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              message="Set your club's priorities to unlock personalised recommendations — funding, opportunities, and players matched to your goals."
              cta="Set your priorities"
              href={`${base}/priorities`}
            />
          )}
        </section>

        {/* Action tracker */}
        <section className="card" aria-labelledby="h-actions">
          <h2 id="h-actions">
            Your actions <span className="count-badge">{actions.length} logged</span>
          </h2>
          {actions.length > 0 ? (
            <>
              {actions.slice(0, 5).map((a) => (
                <div className="log-row" key={a.log_id}>
                  <div>
                    <div>{a.notes || a.action_key.replaceAll("_", " ")}</div>
                    <div className="log-meta">
                      {new Date(a.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                      {" · "}
                      {a.token_cost} token{a.token_cost === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span className={`status ${a.status}`}>{a.status}</span>
                </div>
              ))}
              <p className="log-meta" style={{ marginTop: 12, color: "var(--text-dim)" }}>
                {spent} of {balanceInfo.allocation} tokens used
              </p>
            </>
          ) : (
            <EmptyState
              message="Actions you take will be tracked here — starting with your first outreach."
              cta="Explore what you can do"
              href={base}
            />
          )}
        </section>

        {/* Community note from Kennedy — rendered live from the database */}
        <section className="card note-card" aria-labelledby="h-note">
          <h2 id="h-note">From The NBRH</h2>
          {club.community_note ? (
            <>
              <p>{club.community_note}</p>
            </>
          ) : (
            <p style={{ color: "var(--text-dim)" }}>
              Updates from The NBRH will appear here as your neighbourhood grows.
            </p>
          )}
        </section>
      </div>

      <p className="asof">
        Data as of{" "}
        {new Date(asOf).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </>
  );
}
