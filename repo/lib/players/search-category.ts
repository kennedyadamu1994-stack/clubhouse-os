import { notFound } from "next/navigation";
import { CATEGORY_SLUG, type Category } from "@/components/nbrh-engine";

/**
 * Reverse of nbrh-engine.tsx's own CATEGORY_SLUG — turns a URL segment
 * like "activities" back into the real Category value NbrhEngine needs
 * as its initialCategory prop. Shared by both Search route trees
 * (public /players/search/[category] and personal /players/
 * [playerToken]/search/[category]) so the slug list is defined once,
 * not copied into every page file.
 *
 * Calls notFound() itself on an unrecognised slug rather than returning
 * null/undefined for the caller to check — every one of its callers
 * would otherwise need to repeat the same "if not found, 404" branch.
 */
export function categoryFromSlug(slug: string): Category {
  const entry = (Object.entries(CATEGORY_SLUG) as [Category, string][]).find(([, s]) => s === slug);
  if (!entry) {
    notFound();
    throw new Error("unreachable — notFound() always throws/redirects"); // keeps this function's return type Category, not Category | undefined, without depending on notFound()'s own `never` return type being visible to every environment that typechecks this file
  }
  return entry[0];
}
