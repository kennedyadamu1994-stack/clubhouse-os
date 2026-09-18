import { PageSkeleton } from "@/components/skeletons/page-skeleton";

/**
 * Skeleton loading state (15 Sep, Kennedy: "ensure the POS has the
 * skeleton loader state") — matches CHOS's own real Search page
 * loading.tsx exactly (plain PageSkeleton, no custom bodyHeight). This
 * covers the brief server-render window only; the real Engine's own
 * data fetch (client-side, after mount) has its own sr-loading/sr-spin
 * state already built in, unrelated to this file.
 */
export default function Loading() {
  return <PageSkeleton />;
}
