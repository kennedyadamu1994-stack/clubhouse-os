import { PageSkeleton } from "@/components/skeletons/page-skeleton";

/** Skeleton loading state (15 Sep, Kennedy: "ensure the POS has the skeleton loader state") — Guide is a static placeholder page, so a plain PageSkeleton is the right fit, same category CHOS's own low-variation pages already use it for. */
export default function Loading() {
  return <PageSkeleton />;
}
