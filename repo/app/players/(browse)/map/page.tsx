import { MapClientBoundary } from "@/components/map-client-boundary";

/**
 * Map — ported from CHOS's own (app/dashboard/[clubToken]/tools/map/
 * page.tsx), 15 Sep, Kennedy: "Take reference from the CHOS. Add a map
 * page from the CHOS & add it into the drop down menu in the POS."
 * MapClientBoundary/NbrhMap take no props at all, no club scoping —
 * genuinely platform-wide, same category as Calendar/getHeaderImages,
 * so this is a direct reuse, not a port needing any changes.
 *
 * No in-card "Map" heading, matching the fix applied to every other
 * POS content page (the layout's own deck header already shows it).
 */
export default function PublicMap() {
  return (
    <div className="card outreach-card">
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        The NBRH interactive map: see sessions across London plotted by location.
      </p>
      <MapClientBoundary />
    </div>
  );
}
