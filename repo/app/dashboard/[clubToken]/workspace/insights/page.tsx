import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { profileCompleteness, peerComparison } from "@/lib/scoring";
import { SessionInsights } from "@/components/session-insights";
import { CollapsibleCard } from "@/components/collapsible-card";

/**
 * Insights. Two distinct things share this page, in this order:
 *
 * 1. Club-specific comparison (this file, built new) — how THIS club's
 *    profile compares to similar clubs nearby. Personalised, per CLAUDE.md
 *    rule 1.
 * 2. Platform-wide session data (components/session-insights.tsx) — price,
 *    ratings, capacity, and popularity across every NBRH session. The same
 *    for every club; general context, not personalised. Ported from a
 *    standalone tool Kennedy already had built and running — see that
 *    component's own comment for why it fetches independently of this
 *    app's own data layer.
 *
 * Club-specific goes first because it's the thing that's actionable for
 * whoever's looking; the platform-wide block is useful background, not
 * "yours," so it sits below.
 */
export default async function Insights({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const peerScores = await db.getPeerCompletenessScores(club.club_id, club.sport, club.area);

  const completeness = profileCompleteness(club);
  const comparison = peerComparison(completeness, peerScores);
  const base = `/dashboard/${clubToken}`;

  const missing: string[] = [];
  if (!club.goals) missing.push("your goals");
  if (club.priorities.length === 0) missing.push("your priorities");
  if (club.kpis.length === 0) missing.push("your KPIs");
  if (club.members_count === null) missing.push("your member count");
  if (club.teams_count === null) missing.push("your team count");

  return (
    <>
      <CollapsibleCard
        id="insights-comparison"
        className="outreach-card"
        heading={
          <>
            Insights <span className="count-badge">how {club.name} compares</span>
          </>
        }
      >
        <section style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: "0.95rem", marginBottom: 10 }}>Profile completeness</h3>
          <div className="stat">{completeness}%</div>
          <p className="stat-label" style={{ marginBottom: 16 }}>
            {club.triage_complete
              ? "Based on your club triage."
              : "An interim measure until your full club triage is built — see below."}
          </p>

          {comparison.comparable ? (
            <p style={{ color: "var(--dim)", fontSize: "0.88rem" }}>
              Among {comparison.totalPeers} {club.sport} clubs in {club.area}, you&apos;re ranked{" "}
              <strong style={{ color: "var(--text)" }}>#{comparison.position}</strong> — the group
              average is {comparison.peerAverage}%.
            </p>
          ) : (
            <p style={{ color: "var(--faint-text)", fontSize: "0.85rem" }}>
              Not enough {club.sport} clubs in {club.area} yet to show a meaningful comparison
              (needs at least 5). As more clubs join The NBRH nearby, this will fill in.
            </p>
          )}
        </section>

        <section style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: "0.95rem", marginBottom: 10 }}>What would improve your score</h3>
          {missing.length > 0 ? (
            <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
              {missing.map((m) => (
                <li key={m} className="rec" style={{ padding: "8px 0" }}>
                  <span className="rec-title" style={{ textTransform: "capitalize" }}>
                    Add {m}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--dim)", fontSize: "0.9rem" }}>
              Your profile has everything we currently ask for — nice work.
            </p>
          )}
        </section>

        <section
          style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}
          aria-labelledby="triage-heading"
        >
          <h3 id="triage-heading" style={{ fontSize: "0.95rem", marginBottom: 8 }}>
            Club triage
          </h3>
          <p style={{ color: "var(--dim)", fontSize: "0.88rem", marginBottom: 14, maxWidth: "60ch" }}>
            The full triage tool — a short form that scores your club and generates tailored
            strengths, weaknesses, and recommended KPIs — is still being built. For now, setting
            your priorities and goals is what powers your recommendations and this page.
          </p>
          <Link className="btn btn-pink" href={`${base}/priorities`}>
            Set your priorities
          </Link>
        </section>
      </CollapsibleCard>

      <div style={{ marginTop: 28, marginBottom: 16 }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>
          Beyond your club
        </p>
        <h2 style={{ marginBottom: 4 }}>What&apos;s happening across The NBRH</h2>
        <p style={{ color: "var(--dim)", fontSize: "0.88rem" }}>
          Session-level data across the whole platform — the same for every club, not specific to{" "}
          {club.name}.
        </p>
      </div>
      <div className="card outreach-card">
        <SessionInsights />
      </div>
    </>
  );
}
