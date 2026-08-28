"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

export interface SearchIndexEntry {
  id: string;
  title: string;
  subtitle: string;
  category:
    | "Player"
    | "Person"
    | "Brand"
    | "Influencer"
    | "Sponsorship"
    | "Club"
    | "Supplier"
    | "Social Venue"
    | "Opportunity"
    | "Resource"
    | "FAQ"
    | "Perk"
    | "Trending"
    | "Service"
    | "Tool";
  href: string;
  searchText: string; // lowercased, pre-joined title+subtitle+extra keywords, built server-side
}

/**
 * Overview's universal search bar — searches across every entity type in
 * the OS (Kennedy's request, 27 Aug fifth follow-up: "can the search bar
 * in overview search all elements from the OS?" — extended from the
 * original four-category version to cover every Outreach subsection,
 * every Workspace tab, Services, and Tools): Players, People, Brands &
 * Businesses, Influencers, Sponsorship & Funding, Clubs, Suppliers,
 * Social Venues, Opportunities, Resources, FAQ, Perks, Trending Topics,
 * Services, and Tools.
 *
 * Filters a lightweight index built server-side in page.tsx — just
 * id/title/subtitle/category/href/searchText per entry, not full
 * records, so this stays cheap even with hundreds of entries across this
 * many sources. Filtering happens entirely client-side as the user
 * types; no network round-trip per keystroke.
 *
 * Shows a dropdown of matched results, each linking directly to the
 * subsection that entity lives in — this app has no per-entity detail
 * route, so a Player or Brand result routes to its Outreach list page,
 * not a page that doesn't exist.
 */
export function OverviewSearchBar({ index }: { index: SearchIndexEntry[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.filter((entry) => entry.searchText.includes(q)).slice(0, 12);
  }, [query, index]);

  return (
    <div className="askbar askbar-search" ref={containerRef}>
      <span className="ic" aria-hidden>
        ⌕
      </span>
      <input
        type="text"
        placeholder="Search players, opportunities, resources, tools…"
        aria-label="Universal search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a click on a result registers before the dropdown closes.
          setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && query.trim() && (
        <div className="askbar-results" role="listbox">
          {results.length === 0 ? (
            <p className="askbar-empty">No matches for "{query.trim()}"</p>
          ) : (
            results.map((r) => (
              <Link key={r.id} href={r.href} className="askbar-result">
                <span className="askbar-result-category">{r.category}</span>
                <span className="askbar-result-main">
                  <span className="askbar-result-title">{r.title}</span>
                  {r.subtitle && <span className="askbar-result-subtitle">{r.subtitle}</span>}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
