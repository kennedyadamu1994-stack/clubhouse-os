import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { NbrhEngine } from "@/components/nbrh-engine";
import { SessionInsights } from "@/components/session-insights";

/**
 * Search — the NBRH Engine, ported. Replaces the old Find tab (which was
 * a plain link-out to thenbrh.co.uk, per Kennedy's decision at the time
 * the actual embed source wasn't available). Now that the real Engine
 * code has been provided, it's ported in properly rather than linked to.
 */
export default async function Search({
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
      <div className="card outreach-card">
        <h2>Search</h2>
        <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
          The NBRH Engine — search sessions, clubs, leagues, venues, and events across the whole
          platform.
        </p>
        <NbrhEngine />
      </div>

      {/* Platform-wide session data — price, ratings, capacity, popularity
          across every NBRH session. Moved here from the now-removed Insights
          page (Kennedy, 20 Aug: only the club-specific comparison box was
          asked to go; this platform-wide block needed a new home). Same
          session data source as the search above, so Tools → Search is the
          natural place for it, not an orphaned standalone page. */}
      <div style={{ marginTop: 28, marginBottom: 16 }}>
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
