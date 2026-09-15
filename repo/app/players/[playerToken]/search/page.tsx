import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { categoryFromSlug } from "@/lib/players/search-category";
import { PlayerSearchEngine } from "@/components/player-search-engine";

/**
 * Personal (token'd) POS Search — content identical to the public
 * version (app/players/(browse)/search/page.tsx), re-guarded per-page
 * the same way the Calendar/Jobs pairs are.
 *
 * Reads the real ?q= search param (15 Sep fix — Kennedy: "there
 * seems to be confusion between the home page search bar and the NBRH
 * Search Engine, they are two different things"). Home's own search
 * form always built a ?q=<query> URL when it deep-linked here, but
 * nothing on this page originally read it — the query was silently
 * dropped, and the Engine's own search box just started empty every
 * time.
 *
 * REWRITTEN (15 Sep) from a dynamic [category] route segment to a
 * plain static page reading ?category= as a query string — see the
 * public Search page's own doc comment for the full story: the
 * dynamic-segment version collided with the public tree's own
 * same-named segment, producing a confirmed, genuine runtime 404 in
 * production despite a clean build. Removing the dynamic segment
 * entirely, on both trees, is the more certain fix — nothing left to
 * collide with.
 */
export default async function PlayerSearch({
  params,
  searchParams,
}: {
  params: Promise<{ playerToken: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { playerToken } = await params;
  const { category: slug, q } = await searchParams;
  const db = getAdapter();
  const player = await db.getPlayerByToken(playerToken);
  if (!player) notFound();

  const category = categoryFromSlug(slug);

  return (
    <div className="card outreach-card">
      <h2>Search</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        The NBRH Engine: search activities, clubs, leagues, venues, people, and events across the
        whole platform.
      </p>
      <PlayerSearchEngine initialCategory={category} initialSearch={q} linkBase={`/players/${playerToken}/search`} />
    </div>
  );
}
