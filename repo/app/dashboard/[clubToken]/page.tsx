import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { profileCompleteness, topRecommendations } from "@/lib/scoring";
import { EmptyState } from "@/components/empty-state";
import { CollapsibleCard } from "@/components/collapsible-card";
import { MatchScoreBadge } from "@/components/match-score-badge";
import { MembershipBody } from "@/components/membership-body";

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
      <div className="askbar">
        <span className="ic" aria-hidden>
          ⌕
        </span>
        <input
          type="text"
          placeholder="Search players, opportunities, resources, tools…"
          aria-label="Universal search"
        />
      </div>

      <div className="grid">
        {/* Profile completeness — interim metric, honestly labelled until triage exists (D10) */}
        <CollapsibleCard id="completeness" heading="Profile completeness">
          <div className="stat">{completeness}%</div>
          <p className="stat-label">
            {club.triage_complete
              ? "Based on your club triage."
              : "Your full club health score arrives with the club triage — coming later in the pilot."}
          </p>
        </CollapsibleCard>

        {/* KPIs — visual language matches the reference "Performance" cards (accent top
            border, serif-styled name, card grid) but doesn't fabricate a target/current/
            status/progress-bar the app has no real data for (club.kpis is just a list of
            goal names, not numeric metrics) — see DECISIONS.md-adjacent note in
            CLAUDE.md rule 1: shown data must be real, never invented to fill a visual
            template. */}
        <CollapsibleCard id="kpis" heading="Your KPIs">
          {club.kpis.length > 0 ? (
            <div className="kpi-grid">
              {club.kpis.map((k) => (
                <div className="kpi-card" key={k}>
                  <div className="kpi-name">{k}</div>
                  <div className="kpi-tracking">Tracking</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              message="Tell us your priorities and we'll recommend the KPIs worth tracking."
              cta="Set your priorities"
              href={`${base}/priorities`}
            />
          )}
        </CollapsibleCard>

        {/* Top 5 recommendations with match scores — colour-scale badge, not the old flat pink chip */}
        <CollapsibleCard
          id="recs"
          className="span2"
          heading={
            <>
              Top recommendations
              {recs.length > 0 && <span className="count-badge">matched to your goals</span>}
            </>
          }
        >
          {recs.length > 0 ? (
            <div>
              {recs.map((r) => (
                <div className="rec" key={`${r.kind}-${r.id}`}>
                  <MatchScoreBadge score={r.score} />
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
        </CollapsibleCard>

        {/* Action tracker */}
        <CollapsibleCard
          id="actions"
          heading={
            <>
              Your actions <span className="count-badge">{actions.length} logged</span>
            </>
          }
        >
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
              <p className="log-meta" style={{ marginTop: 12, color: "var(--dim)" }}>
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
        </CollapsibleCard>

        {/* Membership — moved from its own top-level nav item into a collapsible
            dropdown here (Kennedy's request, 19 Aug), while still keeping its
            own page at /membership (linked below) for anyone who wants a
            direct, shareable URL. Reuses balanceInfo already fetched above
            rather than querying the ledger twice. */}
        <CollapsibleCard id="membership" className="span2" heading="Membership" defaultOpen={false}>
          <MembershipBody
            club={club}
            clubToken={clubToken}
            balance={balanceInfo.balance}
            allocation={balanceInfo.allocation}
          />
        </CollapsibleCard>

        {/* Connected Pages — directory of this club's existing dedicated pages
            elsewhere (session/booking, club profile, league). Kennedy's
            request, 19 Aug. Data lives on Club.connected_pages, eventually
            sourced from the DASHBOARD (X) sheet — for now seeded per-club in
            data/clubs.json since only the demo club has real URLs. Renders
            nothing at all when a club has none, rather than showing an empty
            card or placeholder links (CLAUDE.md rule 4 cuts both ways: no
            dead ends, but also no dead/fake links). */}
        {club.connected_pages && club.connected_pages.length > 0 && (
          <CollapsibleCard id="connected-pages" className="span2" heading="Connected Pages">
            <div className="connected-pages-grid">
              {club.connected_pages.map((p) => (
                <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="connected-page-box">
                  <span className="connected-page-label">{p.label}</span>
                  <span className="connected-page-cta">Open page ↗</span>
                </a>
              ))}
            </div>
          </CollapsibleCard>
        )}

        {/* Community note from Kennedy — rendered live from the database */}
        <CollapsibleCard id="note" className="note-card" heading="From The NBRH">
          {club.community_note ? (
            <p>{club.community_note}</p>
          ) : (
            <p style={{ color: "var(--dim)" }}>
              Updates from The NBRH will appear here as your neighbourhood grows.
            </p>
          )}
        </CollapsibleCard>
      </div>

      <p className="asof">
        Data as of{" "}
        {new Date(asOf).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </>
  );
}
