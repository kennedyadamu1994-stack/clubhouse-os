import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { MapClientBoundary } from "@/components/map-client-boundary";

/**
 * Map — the NBRH interactive map, ported. Leaflet needs window/document,
 * so the actual map component is loaded client-side only via
 * MapClientBoundary (a thin wrapper around next/dynamic with ssr: false —
 * that option can't be passed directly from a Server Component, hence the
 * separate client wrapper).
 */
export default async function MapPage({
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
      <h2>Map</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        The NBRH interactive map — see sessions across London plotted by location.
      </p>
      <MapClientBoundary />
    </div>
  );
}
