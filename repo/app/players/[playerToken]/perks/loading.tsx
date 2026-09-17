import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

/** See the public Perks page's own loading.tsx for the full reasoning — identical skeleton. */
export default function Loading() {
  return <CardGridSkeleton gridClassName="perk-cardgrid" count={4} />;
}
