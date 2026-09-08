/**
 * Base skeleton block — a shimmering placeholder rectangle. Every other
 * skeleton component in this app (OutreachListSkeleton, CardGridSkeleton,
 * etc.) is built from this one primitive, so the shimmer animation and
 * colours only need to be right in one place (Kennedy's request, 27 Aug:
 * skeleton loaders for page transitions, to reduce perceived latency).
 *
 * width/height/radius are plain CSS values (e.g. "60%", "18px") rather
 * than numeric props, since skeleton shapes need to match wildly
 * different real elements (a full-width row, a tiny badge, a circular
 * avatar) and a numeric-only API would need constant special-casing.
 */
export function SkeletonBlock({
  width = "100%",
  height = "16px",
  radius = "var(--radius)",
  style,
}: {
  width?: string;
  height?: string;
  radius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="skeleton-block"
      aria-hidden
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
