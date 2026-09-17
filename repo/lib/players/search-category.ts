import { CATEGORY_SLUG, type Category } from "@/components/nbrh-engine";

/**
 * Reverse of nbrh-engine.tsx's own CATEGORY_SLUG — turns a URL slug
 * like "activities" back into the real Category value NbrhEngine needs
 * as its initialCategory prop. Shared by both Search pages (public
 * /players/search and personal /players/[playerToken]/search) so the
 * slug list is defined once, not copied into every page file.
 *
 * Falls back to "Activities" on a missing/unrecognised slug rather than
 * calling notFound() (15 Sep rewrite — Search moved from a dynamic
 * [category] route segment to a plain ?category= query string on a
 * static page, specifically to eliminate a same-name dynamic-segment
 * collision between the public and personal Search trees that was
 * producing a genuine runtime 404 in production — confirmed via a live
 * Network-tab check — despite `next build` succeeding, a known Next.js
 * 15 behaviour for this exact shape). A missing/blank query param on a
 * static page is a completely ordinary, expected case (the very first
 * visit to /players/search with no category chosen yet), not a broken
 * link — a 404 here would be actively wrong, unlike the old dynamic
 * route where an unrecognised URL segment really did mean "this page
 * doesn't exist."
 */
export function categoryFromSlug(slug: string | undefined): Category {
  const entry = (Object.entries(CATEGORY_SLUG) as [Category, string][]).find(([, s]) => s === slug);
  return entry ? entry[0] : "Activities";
}
