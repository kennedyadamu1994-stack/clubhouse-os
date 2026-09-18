import { PageSkeleton } from "@/components/skeletons/page-skeleton";

/**
 * Skeleton loading state (15 Sep, Kennedy: "ensure the POS has the
 * skeleton loader state") — matches CHOS's own real Map page loading.tsx
 * exactly (the map itself is loaded client-side via MapClientBoundary's
 * own next/dynamic ssr:false, which has its own loading state — this
 * covers only the brief server-render window before that mounts).
 */
export default function Loading() {
  return <PageSkeleton />;
}
