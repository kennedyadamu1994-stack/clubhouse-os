import { SkeletonBlock } from "./skeleton-block";

/**
 * Mirrors a .cardgrid page (currently just Perks — see perk-card.tsx's
 * head/title/partner/description/offer shape) rather than the entry-row
 * shape OutreachListSkeleton covers. gridClassName lets a caller pass its
 * own grid modifier class (e.g. "perk-cardgrid") so the skeleton sits in
 * the exact same grid as the real content and doesn't reflow when it's
 * replaced (Kennedy's request, 27 Aug: reduce perceived latency).
 */
export function CardGridSkeleton({
  count = 4,
  gridClassName = "",
}: {
  count?: number;
  gridClassName?: string;
}) {
  return (
    <div className="card outreach-card">
      <div style={{ marginBottom: 16 }}>
        <SkeletonBlock width="160px" height="22px" />
      </div>
      <div className={`cardgrid ${gridClassName}`.trim()}>
        {Array.from({ length: count }).map((_, i) => (
          <div className="perk-card skeleton-tile" key={i} aria-hidden>
            <div className="perk-card-head">
              <SkeletonBlock width="60%" height="19px" />
            </div>
            <SkeletonBlock width="40%" height="13px" style={{ marginBottom: 12 }} />
            <SkeletonBlock height="13px" style={{ marginBottom: 6 }} />
            <SkeletonBlock width="80%" height="13px" style={{ marginBottom: 14 }} />
            <SkeletonBlock width="100px" height="34px" />
          </div>
        ))}
      </div>
    </div>
  );
}
