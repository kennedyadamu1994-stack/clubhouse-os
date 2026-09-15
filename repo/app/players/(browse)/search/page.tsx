import { NbrhEngine } from "@/components/nbrh-engine";
import { categoryFromSlug } from "@/lib/players/search-category";

/**
 * POS Search — the real split into category-aware pages Kennedy asked
 * for (15 Sep: "instead of the self contained tool, it utilises the
 * drop down bar to change pages"). NbrhEngine itself is completely
 * unmodified in its actual filter/sort/list-view logic — only its tab
 * bar switches from setCategory() buttons to real links when linkBase
 * is passed (see NbrhEngineProps' own doc comment). showPeople=true is
 * the other real difference from CHOS's own /tools/search page, which
 * never passes it — People is one of the categories Kennedy listed for
 * POS's search but was never shown on CHOS.
 *
 * REWRITTEN (15 Sep) from a dynamic [category] route segment to a
 * plain static page reading ?category= as a query string. The dynamic-
 * segment version produced a genuine, confirmed runtime 404 in
 * production — Network tab showed a real 404 document response for
 * /players/search/activities — because this route and the personal
 * tree's own Search route both defined a same-named dynamic segment at
 * a position Next.js 15's router treats as colliding, a known issue
 * where `next build` succeeds and only the live request fails. Renaming
 * the segment was the first attempted fix; when that still didn't
 * resolve it live, removing the dynamic segment entirely — nothing
 * left to collide with, on either tree, ever — was the more certain
 * fix. category and q are both plain query params now, not URL path
 * segments; NavLinks/TabBar/Home's own search form all build
 * /players/search?category=activities&q=... accordingly.
 */
export default async function PublicSearch({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category: slug, q } = await searchParams;
  const category = categoryFromSlug(slug);

  return (
    <div className="card outreach-card">
      <h2>Search</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        The NBRH Engine: search activities, clubs, leagues, venues, people, and events across the
        whole platform.
      </p>
      <NbrhEngine initialCategory={category} initialSearch={q} showPeople linkBase="/players/search" />
    </div>
  );
}
