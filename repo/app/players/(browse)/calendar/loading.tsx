import { PageSkeleton } from "@/components/skeletons/page-skeleton";

/**
 * Skeleton loading state (15 Sep, Kennedy: "ensure the POS has the
 * skeleton loader state") — Next.js auto-renders this loading.tsx
 * while the sibling page.tsx (a real async Server Component) is
 * fetching, the same convention CHOS already uses throughout (see
 * app/dashboard/[clubToken]/loading.tsx and its many siblings).
 * PageSkeleton, not OutreachListSkeleton — Calendar renders through
 * CalendarView, a genuinely custom widget, not an entry-row list, the
 * same category CHOS's own Calendar/Insights pages already use
 * PageSkeleton for (see that component's own doc comment).
 */
export default function Loading() {
  return <PageSkeleton bodyHeight="420px" />;
}
