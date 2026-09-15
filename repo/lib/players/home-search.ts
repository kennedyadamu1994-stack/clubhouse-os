import { fetchCategoryItems, type Item, type Category } from "@/components/nbrh-engine";

/**
 * Home's own cross-category live search (15 Sep — Kennedy: the Home
 * search box needs to search "everything," combining all six
 * categories at once, unlike Search's own per-category matching, which
 * only ever filters within whichever one category is currently active
 * (NbrhEngine's own passesSearch, components/nbrh-engine.tsx, is
 * private to that component and category-scoped by design). This is a
 * dedicated function, not a reuse of that one, because "search
 * everything at once" genuinely doesn't exist anywhere else in this
 * codebase yet — it fetches every category in parallel (reusing
 * fetchCategoryItems, the same real fetch+filter pipeline Search
 * itself uses) and matches the same field set passesSearch checks,
 * kept in sync by hand since that function isn't exported.
 */
const HOME_SEARCH_CATEGORIES: Category[] = ["Activities", "Clubs", "Leagues", "Venues", "Events", "People"];

export interface HomeSearchResult {
  item: Item;
}

function matchesTerm(item: Item, term: string): boolean {
  const fields = [
    item.name, item.club, item.type, item.category, item.location, item.address, item.difficulty,
    item.vibe, item.ageGroup, item.audience, item.badge, item.description, item.sessionStatus,
    item.dayOfWeek, item.sessionType, item.sport, item.specialisation, item.certifications,
    item.ageGroups, item.availability, item.borough, item.competitiveOrSocial, item.skillLevel,
  ];
  return fields.some((f) => f && f.toLowerCase().includes(term));
}

/**
 * Fetches every category and returns items matching the search term
 * across all of them combined. Returns [] immediately for a blank
 * term, rather than fetching anything — Home shouldn't hit the network
 * on every keystroke before the person has actually typed something.
 */
export async function searchAllCategories(term: string): Promise<HomeSearchResult[]> {
  const trimmed = term.trim().toLowerCase();
  if (!trimmed) return [];

  const results = await Promise.all(HOME_SEARCH_CATEGORIES.map((cat) => fetchCategoryItems(cat)));
  return results
    .flat()
    .filter((item) => matchesTerm(item, trimmed))
    .map((item) => ({ item }));
}
