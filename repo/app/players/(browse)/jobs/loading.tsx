import { OutreachListSkeleton } from "@/components/skeletons/outreach-list-skeleton";

/**
 * Skeleton loading state (15 Sep, Kennedy: "ensure the POS has the
 * skeleton loader state"). OutreachListSkeleton, not PageSkeleton —
 * Jobs genuinely renders an entry-list of OpportunityCard rows (same
 * .entry-row/.entry-avatar/.entry-main/.entry-actions shape this
 * skeleton was already built for), so it fits directly with no
 * adaptation needed.
 */
export default function Loading() {
  return <OutreachListSkeleton />;
}
