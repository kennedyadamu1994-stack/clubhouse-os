import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

export default function Loading() {
  return <CardGridSkeleton gridClassName="perk-cardgrid" count={4} />;
}
