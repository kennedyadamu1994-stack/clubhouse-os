import { SkeletonBlock } from "./skeleton-block";

/**
 * Mirrors Overview's real shape (Kennedy's request, 27 Aug) — the most
 * visited page, so it gets its own dedicated skeleton rather than the
 * generic PageSkeleton fallback. Matches, in order: the banner carousel
 * area, the universal search bar, Club Health's stacked score bars (now
 * above Your KPIs per the 27 Aug desktop-stacking change), Your KPIs as
 * a horizontally-scrolling row (also 27 Aug), and a short Recommendations
 * list. Note this skeleton renders standalone, without the HeaderCarousel/
 * deck-head that the real page's parent layout renders around it — those
 * belong to DashboardLayout, not this route segment's own loading.tsx.
 */
export function OverviewSkeleton() {
  return (
    <>
      <div className="askbar" aria-hidden>
        <span className="ic" aria-hidden>
          ⌕
        </span>
        <SkeletonBlock height="48px" />
      </div>

      <div className="grid">
        <div className="card" aria-hidden>
          <div style={{ padding: "18px 24px" }}>
            <SkeletonBlock width="140px" height="20px" style={{ marginBottom: 18 }} />
            <SkeletonBlock width="80px" height="40px" style={{ margin: "0 auto 20px" }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <SkeletonBlock width="35%" height="12px" style={{ marginBottom: 8 }} />
                <SkeletonBlock height="8px" />
              </div>
            ))}
          </div>
        </div>

        <div className="card" aria-hidden>
          <div style={{ padding: "18px 24px" }}>
            <SkeletonBlock width="110px" height="20px" style={{ marginBottom: 18 }} />
            <div className="kpi-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="kpi-card skeleton-tile" key={i}>
                  <SkeletonBlock width="50px" height="12px" style={{ marginBottom: 10 }} />
                  <SkeletonBlock width="80%" height="13px" style={{ marginBottom: 14 }} />
                  <SkeletonBlock width="60%" height="30px" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card span2" aria-hidden>
          <div style={{ padding: "18px 24px" }}>
            <SkeletonBlock width="200px" height="20px" style={{ marginBottom: 18 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="rec" key={i}>
                <SkeletonBlock width="42px" height="24px" radius="var(--radius)" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <SkeletonBlock width="50%" height="14px" />
                  <SkeletonBlock width="30%" height="12px" />
                </div>
                <SkeletonBlock width="90px" height="34px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
