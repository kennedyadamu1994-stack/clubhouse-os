import { Suspense } from "react";
import { categoryFromSlug } from "@/lib/players/search-category";
import { PlayerSearchEngine } from "@/components/player-search-engine";

/**
 * POS Search — the real split into category-aware pages Kennedy asked
 * for (15 Sep: "instead of the self contained tool, it utilises the
 * drop down bar to change pages"). NbrhEngine itself is completely
 * unmodified in its actual filter/sort/list-view logic — only its tab
 * bar switches from setCategory() buttons to real links when linkBase
 * is passed, and its per-card renderer switches from EngineCard to
 * PlayerEntryCard when cardRenderer is passed (see NbrhEngineProps'
 * own doc comments). showPeople is the other real difference from
 * CHOS's own /tools/search page — People is one of the categories
 * Kennedy listed for POS's search but was never shown on CHOS.
 *
 * Renders PlayerSearchEngine (components/player-search-engine.tsx), a
 * thin client wrapper, rather than NbrhEngine directly — cardRenderer
 * is a function prop, which can't cross the server/client boundary
 * from this async server page (functions aren't serialisable in React
 * Server Components); this page stays server-side so it can read
 * searchParams normally, and hands off to the one client piece that
 * actually needs to build the function.
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
 *
 * No in-card "Search" heading (15 Sep, Kennedy: "remove the additional
 * title... across the POS for each section") — the layout above this
 * page already renders the section title (PlayerPageTitle, components/
 * player-nav.tsx) in the deck header; repeating it inside the card
 * below was a real, visible duplicate on every POS content page.
 *
 * PlayerSearchEngine is wrapped in <Suspense> (15 Sep) — it now reads
 * useSearchParams() internally (see NbrhEngine's own doc comment for
 * why: a real bug where category stayed stuck on Activities even after
 * a hard refresh, fixed by reading the live URL directly instead of a
 * prop-plus-sync-effect chain), and Next.js requires any component
 * using useSearchParams() to sit under a Suspense boundary or the
 * build itself will fail/bail out of static generation for the route.
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
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        The NBRH Engine: search activities, clubs, leagues, venues, people, and events across the
        whole platform.
      </p>
      <Suspense fallback={<div className="sr-loading"><div className="sr-spin" /></div>}>
        <PlayerSearchEngine initialCategory={category} initialSearch={q} linkBase="/players/search" />
      </Suspense>
    </div>
  );
}
