import { SkeletonBlock } from "./skeleton-block";

/**
 * Mirrors Trending's real card shape (.trending-card: a fixed-width
 * thumbnail + a text body with meta/headline/summary) — distinct enough
 * from the entry-row pattern OutreachListSkeleton covers that it earns
 * its own skeleton (Kennedy's request, 27 Aug).
 */
export function TrendingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="card outreach-card">
      <div style={{ marginBottom: 16 }}>
        <SkeletonBlock width="200px" height="22px" />
      </div>
      <div className="trending-list">
        {Array.from({ length: count }).map((_, i) => (
          <div className="trending-card skeleton-tile" key={i} aria-hidden>
            <div className="trending-card-thumb skeleton-block" />
            <div className="trending-card-body">
              <SkeletonBlock width="120px" height="13px" style={{ marginBottom: 12 }} />
              <SkeletonBlock width="85%" height="21px" style={{ marginBottom: 10 }} />
              <SkeletonBlock height="13px" style={{ marginBottom: 6 }} />
              <SkeletonBlock width="60%" height="13px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
