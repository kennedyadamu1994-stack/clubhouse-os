import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

/**
 * Skeleton loading state (15 Sep, Kennedy: "ensure the POS has the
 * skeleton loader state") — matches CHOS's own real Perks page loading.tsx
 * exactly, since PlayerPerkCard renders inside the same real
 * perk-cardgrid layout as PerkCard.
 */
export default function Loading() {
  return <CardGridSkeleton gridClassName="perk-cardgrid" count={4} />;
}
