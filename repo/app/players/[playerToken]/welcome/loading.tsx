import { PageSkeleton } from "@/components/skeletons/page-skeleton";

/**
 * Skeleton loading state for the welcome splash — this page fetches the
 * real player server-side (getPlayerByToken) before rendering, so this
 * covers that genuine async window. A plain PageSkeleton rather than
 * a bespoke splash-shaped skeleton — this page is only ever seen once,
 * right after onboarding, so a heavier content-specific skeleton isn't
 * worth building for a single-visit page.
 */
export default function Loading() {
  return <PageSkeleton />;
}
