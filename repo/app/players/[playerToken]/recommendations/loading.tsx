import { PageSkeleton } from "@/components/skeletons/page-skeleton";

/**
 * Skeleton loading state — this page does fetch the real player server-
 * side (getPlayerByToken) before handing off to ForYouViewAuto, so this
 * genuinely covers a real async window, not just an instant no-op.
 */
export default function Loading() {
  return <PageSkeleton />;
}
