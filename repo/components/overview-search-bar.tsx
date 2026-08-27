"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

export interface SearchIndexEntry {
  id: string;
  title: string;
  subtitle: string;
  category: "Player" | "Opportunity" | "Resource" | "FAQ" | "Tool";
  href: string;
  searchText: string; // lowercased, pre-joined title+subtitle+extra keywords, built server-side
}

/**
 * Overview's universal search bar (Kennedy's request, 27 Aug fourth
 * follow-up: "can you get the search bar working and connected?
 * Specifically in the overview section") — was previously a static,
 * non-functional <input> with no state or handler at all.
 *
 * Searches across Players, Opportunities, Resources, FAQ, and Tools (the
 * four categories the bar's own placeholder text already promised:
 * "Search players, opportunities, resources, tools…") by filtering a
 * lightweight index built server-side in page.tsx — just id/title/
 * subtitle/category/href/searchText per entry, not full records, so this
 * stays cheap even with hundreds of entries. Filtering happens entirely
 * client-side as the user types; no network round-trip per keystroke.
 *
 * Shows a dropdown of matched results grouped by category, each linking
 * directly to the right page — clicking a Player result goes to
 * Outreach → Players (not to a nonexistent single-player page, since
 * this app has no per-entity detail route), clicking a Resource goes
 * straight to Workspace → Resources, etc.
 */
export function OverviewSearchBar({ index }: { index: SearchIndexEntry[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.filter((entry) => entry.searchText.includes(q)).slice(0, 8);
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
