import { OutreachListSkeleton } from "@/components/skeletons/outreach-list-skeleton";

/**
 * Shown automatically by Next.js while this route segment's page.tsx does
 * its async data fetch (Kennedy's request, 27 Aug: skeleton loaders on
 * page transitions to reduce perceived latency). No props — Next.js's
 * loading.tsx convention doesn't pass any.
 */
export default function Loading() {
  return <OutreachListSkeleton />;
}
