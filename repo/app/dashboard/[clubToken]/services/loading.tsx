import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

export default function Loading() {
  return <CardGridSkeleton gridClassName="service-cardgrid" count={4} />;
}
