import { PageSkeleton } from "@/components/skeletons/page-skeleton";

/** See the public Calendar page's own loading.tsx for the full reasoning — identical skeleton, matching CHOS's own real Calendar loading.tsx bodyHeight exactly. */
export default function Loading() {
  return <PageSkeleton bodyHeight="420px" />;
}
