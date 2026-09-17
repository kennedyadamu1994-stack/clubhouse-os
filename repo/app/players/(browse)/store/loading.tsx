import { PageSkeleton } from "@/components/skeletons/page-skeleton";

/** Skeleton loading state (15 Sep, Kennedy: "ensure the POS has the skeleton loader state") — Club Store is a static placeholder page, same category as Guide. */
export default function Loading() {
  return <PageSkeleton />;
}
