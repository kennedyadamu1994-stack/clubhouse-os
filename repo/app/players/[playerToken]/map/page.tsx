import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { MapClientBoundary } from "@/components/map-client-boundary";

/** Personal (token'd) POS Map — content identical to the public version, re-guarded per-page the same way the Calendar/Jobs pairs are. */
export default async function PlayerMap({
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
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        The NBRH interactive map: see sessions across London plotted by location.
      </p>
      <MapClientBoundary />
    </div>
  );
}
