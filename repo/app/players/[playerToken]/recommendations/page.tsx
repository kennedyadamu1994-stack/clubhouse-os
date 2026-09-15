import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { ForYouViewAuto } from "@/components/for-you-view-auto";

/**
 * "For You" (displayed label; internal file/route/function naming
 * stays "recommendations" — Kennedy's 15 Sep rename was display-copy
 * only) — thin server page. Looks up the player (same getPlayerByToken
 * guard pattern as Calendar/Jobs/Search's own personal pages) purely
 * to get their real email, then hands off to ForYouViewAuto (components/
 * for-you-view-auto.tsx), which signs the email session in
 * automatically using that known email — someone already on their own
 * personal token'd page shouldn't have to type their email in again
 * for "For You" specifically, unlike a visitor arriving at the public
 * tree with no known identity at all.
 *
 * REWRITTEN (15 Sep) — the earlier version passed the whole Player
 * straight into the old scoring engine (buildRecommendations, now
 * removed) with no login step at all. The new email-session
 * architecture (Kennedy's decision) means every "For You" page, token'd
 * or not, ultimately goes through the same real session — this one
 * just starts it automatically instead of asking.
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
      <h2>For You</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        Activities matched to your own profile, scored the same way the real recommendations engine does.
      </p>
      <ForYouViewAuto knownEmail={player.email} />
    </div>
  );
}
