import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { NbrhEngine } from "@/components/nbrh-engine";
import { categoryFromSlug } from "@/lib/players/search-category";

/**
 * Personal (token'd) POS Search — content identical to the public
 * version (app/players/search/[category]/page.tsx), re-guarded per-page
 * the same way the Calendar/Jobs pairs are.
 *
 * Now reads the real ?q= search param (15 Sep fix — Kennedy: "there
 * seems to be confusion between the home page search bar and the NBRH
 * Search Engine, they are two different things"). Home's own search
 * form (app/players/[playerToken]/page.tsx) always built a
 * ?q=<query> URL when it deep-linked here, but nothing on this page
 * ever read it — the query was silently dropped, and the Engine's own
 * search box just started empty every time. searchParams (like params)
 * is a Promise in Next.js 15's App Router, same as params.
 */
export default async function PlayerSearch({
  params,
  searchParams,
}: {
  params: Promise<{ playerToken: string; category: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { playerToken, category: slug } = await params;
  const { q } = await searchParams;
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
      <NbrhEngine initialCategory={category} initialSearch={q} showPeople linkBase={`/players/${playerToken}/search`} />
    </div>
  );
}
