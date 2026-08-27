import { SkeletonBlock } from "./skeleton-block";

/**
 * Generic fallback for pages that are mostly static UI rather than a data
 * list — Search, Map, Contact Us, Copy Generator, Membership — and also
 * used (with a taller bodyHeight) for genuinely custom widget pages like
 * Calendar and Insights, where a pixel-accurate skeleton would take more
 * effort than it's worth for a fairly low-frequency page. These pages
 * have very little that actually varies per club/session (a form, a map
 * embed, static copy), so a heavy content-specific skeleton isn't worth
 * building — a title bar plus a couple of body blocks gives the same
 * perceived-latency benefit (Kennedy's request, 27 Aug) without
 * over-fitting a shape that would need updating every time the real page
 * changes.
 */
export function PageSkeleton({ bodyHeight = "120px" }: { bodyHeight?: string }) {
  return (
    <div className="card outreach-card">
      <div style={{ marginBottom: 18 }}>
        <SkeletonBlock width="180px" height="22px" />
      </div>
      <SkeletonBlock height="14px" style={{ marginBottom: 10 }} />
      <SkeletonBlock width="75%" height="14px" style={{ marginBottom: 24 }} />
      <SkeletonBlock height={bodyHeight} radius="var(--radius)" />
    </div>
  );
}
