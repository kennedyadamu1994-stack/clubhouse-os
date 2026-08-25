import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { profileCompleteness, topRecommendations } from "@/lib/scoring";
import { EmptyState } from "@/components/empty-state";
import { CollapsibleCard } from "@/components/collapsible-card";
import { MatchScoreBadge } from "@/components/match-score-badge";
import { MembershipBody } from "@/components/membership-body";
import { ClubHealthCard } from "@/components/club-health-card";
import { SeeMoreActionsButton } from "@/components/see-more-actions-button";
import { RecommendationActionButton } from "@/components/recommendation-action-button";

export default async function Overview({ params }: { params: Promise<{ clubToken: string }> }) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [weights, sponsorships, opportunities, players, actions, asOf, balanceInfo, plans] =
    await Promise.all([
      getScoreWeights(),
      db.getSponsorships(),
      db.getOpportunities(),
      db.getPlayers(),
      db.getActionsForClub(club.club_id),
      db.dataAsOf(),
      db.getTokenBalance(club.club_id),
      db.getPlans(),
    ]);

  const completeness = profileCompleteness(club);
  const recs = topRecommendations(club, sponsorships, opportunities, players, weights);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
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
        {/* Club Health — replaces Profile completeness entirely (Kennedy's
            request, 20 Aug). Five real values from DASHBOARD (X)'s CHP1-5
            columns. Falls back to the old completeness-based display only
            when club_health is absent (local/demo adapter has no seed data
            for it yet) — never shows broken/zeroed bars. */}
        <CollapsibleCard id="club-health" heading="Club Health">
          {club.club_health ? (
            <ClubHealthCard health={club.club_health} />
          ) : (
            <>
              <div className="stat">{completeness}%</div>
              <p className="stat-label">
                {club.triage_complete
                  ? "Based on your club triage."
                  : "Your full club health score arrives once it's set up in the database."}
              </p>
            </>
          )}
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
              {club.kpis.map((kpi, i) => {
                // kpi.value/target are raw strings — try a numeric progress
                // bar when both parse cleanly as numbers (strips £/,/% for
                // the comparison only; display keeps the original text).
                const numericValue = kpi.value ? Number(kpi.value.replace(/[£,%\s]/g, "")) : null;
                const numericTarget = kpi.target ? Number(kpi.target.replace(/[£,%\s]/g, "")) : null;
                const canShowProgress =
                  numericValue != null && !Number.isNaN(numericValue) &&
                  numericTarget != null && !Number.isNaN(numericTarget) && numericTarget > 0;
                const progressPct = canShowProgress
                  ? Math.min(100, Math.round((numericValue! / numericTarget!) * 100))
                  : null;

                return (
                  <div className="kpi-card" key={kpi.name}>
                    <span className="kpi-index">KPI {String(i + 1).padStart(2, "0")}</span>
                    <div className="kpi-name">{kpi.name}</div>
                    {kpi.value ? (
                      <>
                        <div className="kpi-value">
                          {kpi.value}
                          {kpi.target && <span className="kpi-target">of {kpi.target}</span>}
                        </div>
                        {progressPct != null && (
                          <div className="kpi-progress-track">
                            <div className="kpi-progress-fill" style={{ width: `${progressPct}%` }} />
                          </div>
                        )}
                      </>
                    ) : kpi.target ? (
                      <div className="kpi-value kpi-value-target-only">
                        <span className="kpi-target-label">Target</span>
                        {kpi.target}
                      </div>
                    ) : (
                      <div className="kpi-tracking">Tracking</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--dim)" }}>
              KPIs will appear here once they&apos;re set for your club.
            </p>
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
                  <RecommendationActionButton
                    rec={r}
                    clubToken={clubToken}
                    club_id={club.club_id}
                    isFirstTokenEncounter={isFirstToken}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--dim)" }}>
              No recommendations yet — check back as more funding, opportunities, and players are
              added.
            </p>
          )}
        </CollapsibleCard>

        {/* Action tracker */}
        <CollapsibleCard
          id="actions"
          className="span2"
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
              {actions.length > 5 && <SeeMoreActionsButton actions={actions} />}
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
            plans={plans}
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
        <CollapsibleCard id="note" className="span2 note-card" heading="From The NBRH">
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
