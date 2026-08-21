import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { SessionInsights } from "@/components/session-insights";

/**
 * "What's happening across The NBRH" — its own standalone Tools subsection
 * (Kennedy's request, 20 Aug: was briefly tacked onto the bottom of Tools →
 * Search after Insights was removed; now gets its own dedicated page).
 * Platform-wide session data (price, ratings, capacity, popularity across
 * every NBRH session) — the same for every club, not personalised. See
 * components/session-insights.tsx for why it fetches independently of this
 * app's own data layer.
 */
export default async function ToolsInsights({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>
          Beyond your club
        </p>
        <h2 style={{ marginBottom: 4 }}>What&apos;s happening across The NBRH</h2>
        <p style={{ color: "var(--dim)", fontSize: "0.88rem" }}>
          Session-level data across the whole platform — the same for every club.
        </p>
      </div>
      <div className="card outreach-card">
        <SessionInsights />
      </div>
    </>
  );
}
