import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { NbrhEngine } from "@/components/nbrh-engine";

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
    <div className="card outreach-card">
      <h2>Search</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        The NBRH Engine — search sessions, clubs, leagues, venues, and events across the whole
        platform.
      </p>
      <NbrhEngine />
    </div>
  );
}
