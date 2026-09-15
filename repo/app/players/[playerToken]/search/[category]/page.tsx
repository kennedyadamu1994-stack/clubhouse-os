import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { NbrhEngine } from "@/components/nbrh-engine";
import { categoryFromSlug } from "@/lib/players/search-category";

/** Personal (token'd) POS Search — content identical to the public version (app/players/search/[category]/page.tsx), re-guarded per-page the same way the Calendar/Jobs pairs are. */
export default async function PlayerSearch({
  params,
}: {
  params: Promise<{ playerToken: string; category: string }>;
}) {
  const { playerToken, category: slug } = await params;
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
      <NbrhEngine initialCategory={category} showPeople linkBase={`/players/${playerToken}/search`} />
    </div>
  );
}
