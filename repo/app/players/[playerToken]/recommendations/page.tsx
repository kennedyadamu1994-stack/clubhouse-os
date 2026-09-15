import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { RecommendationsClient } from "@/components/recommendations-client";

/**
 * Recommendations — thin server page. Looks up the player (same
 * getPlayerByToken guard pattern as Calendar/Jobs/Search's own
 * personal pages) and hands the real profile to RecommendationsClient,
 * which does the actual matching client-side — see that component's
 * own doc comment for why the fetch itself can't happen here.
 *
 * A public/token-less version now exists too (app/players/(browse)/
 * recommendations/page.tsx, 15 Sep) — Recommendations stays visible in
 * the nav for everyone, but genuinely can't compute a real match
 * without a player profile, so that version prompts someone to get
 * started instead of showing anything personalised.
 */
export default async function PlayerRecommendations({
  params,
}: {
  params: Promise<{ playerToken: string }>;
}) {
  const { playerToken } = await params;
  const db = getAdapter();
  const player = await db.getPlayerByToken(playerToken);
  if (!player) notFound();

  return (
    <div className="card outreach-card">
      <h2>Recommendations</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        Activities, clubs, leagues, and events matched to your own profile.
      </p>
      <RecommendationsClient player={player} playerToken={playerToken} />
    </div>
  );
}
