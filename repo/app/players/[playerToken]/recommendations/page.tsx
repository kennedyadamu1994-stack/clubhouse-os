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
 * No public/token-less version of this page exists (unlike Calendar/
 * Jobs/Search) — Recommendations has no meaning without a player
 * profile to match against, which is also why it's marked
 * personalOnly in the nav (components/player-nav.tsx) rather than
 * shown to a visitor with no token.
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
