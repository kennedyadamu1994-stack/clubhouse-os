import { SkeletonBlock } from "./skeleton-block";

/**
 * Mirrors the real shape of an Outreach subsection page — .card.outreach-card
 * containing an h2, a SearchFilterBar (.subtoolbar), and a run of
 * .entry-row-shaped rows — so the skeleton doesn't jump/resize once real
 * content replaces it (Kennedy's request, 27 Aug: reduce perceived
 * latency during page transitions). rows defaults to 5, a reasonable
 * middle ground between a mostly-empty club and a mostly-full one.
 */
export function OutreachListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card outreach-card">
      <div style={{ marginBottom: 16 }}>
        <SkeletonBlock width="220px" height="22px" />
      </div>

      <div className="subtoolbar" aria-hidden>
        <SkeletonBlock height="42px" style={{ flex: 1, minWidth: 200 }} />
        <SkeletonBlock width="120px" height="42px" />
      </div>

      <div className="entry-list">
        {Array.from({ length: rows }).map((_, i) => (
          <div className="entry-row skeleton-entry-row" key={i} aria-hidden>
            <span className="entry-avatar skeleton-block" />
            <div className="entry-main" style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
              <SkeletonBlock width="45%" height="15px" />
              <SkeletonBlock width="70%" height="13px" />
            </div>
            <div className="entry-actions">
              <SkeletonBlock width="90px" height="36px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
