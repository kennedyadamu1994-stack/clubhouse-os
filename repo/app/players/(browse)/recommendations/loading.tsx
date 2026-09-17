import { PageSkeleton } from "@/components/skeletons/page-skeleton";

/**
 * Skeleton loading state (15 Sep, Kennedy: "ensure the POS has the
 * skeleton loader state") — this page itself does no real async data
 * fetching (it just renders ForYouView, a client component with its
 * own real sr-loading/sr-spin state once it mounts), so this only
 * covers the brief initial-navigation window before that happens.
 */
export default function Loading() {
  return <PageSkeleton />;
}
