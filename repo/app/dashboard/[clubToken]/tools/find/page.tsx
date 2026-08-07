import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";

/**
 * Find (docs/sections 03-05 § Tools): "straight integration of the existing
 * NBRH Engine ... ask Kennedy which the Engine supports." Checked
 * thenbrh.co.uk directly — the Engine is a widget embedded inline on that
 * page (a Squarespace-hosted search/filter tool), not a standalone tool
 * with its own URL that supports embedding elsewhere or a prefill
 * parameter. Kennedy confirmed (4 Aug): link out to thenbrh.co.uk in a new
 * tab rather than attempt an iframe embed. If the Engine later gets a
 * standalone, embeddable URL, this page is the one place to upgrade it —
 * this is deliberately a plain link-out, not the club's own outreach
 * component.
 */
export default async function Find({
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
      <h2>Find</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "56ch" }}>
        The NBRH Engine is our universal search — sessions, clubs, leagues, venues, and people,
        all filterable in one place. It opens on thenbrh.co.uk in a new tab.
      </p>
      <a
        className="btn btn-black"
        href="https://www.thenbrh.co.uk/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open the NBRH Engine
      </a>
    </div>
  );
}
