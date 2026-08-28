"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Info, ArrowUpRight } from "lucide-react";

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
  /** One extra line shown when a result is expanded via the Info button (28 Aug) — a description/summary already available on the entity, not a new fetch. Omitted for entities with nothing more to show than title/subtitle (e.g. Tools). */
  detail?: string;
}

/**
 * Overview's universal search bar — searches across every entity type in
 * the OS (Kennedy's request, 27 Aug fifth follow-up, extended 28 Aug with
 * Info/View buttons on each result): Players, People, Brands &
 * Businesses, Influencers, Sponsorship & Funding, Clubs, Suppliers,
 * Social Venues, Opportunities, Resources, FAQ, Perks, Trending Topics,
 * Services, and Tools.
 *
 * Filters a lightweight index built server-side in page.tsx — just
 * id/title/subtitle/category/href/searchText/detail per entry, not full
 * records, so this stays cheap even with hundreds of entries across this
 * many sources. Filtering happens entirely client-side as the user
 * types; no network round-trip per keystroke.
 *
 * Each result has two actions (Kennedy, 28 Aug: "add the Info and view
 * option buttons in the result, so they can quickly access those
 * actions"):
 *   - Info: expands the row in place to show `detail` (a description/
 *     summary already in the index) — a genuine compact preview, no
 *     navigation, no extra fetch.
 *   - View: navigates to the real subsection page. This deliberately
 *     does NOT try to render real action buttons (pink/black Send
 *     invite/Contact/etc.) inline in the dropdown — those need live,
 *     full-record data (the actual ActionOption[] for that specific
 *     entry, isFirstTokenEncounter, club_id) that the lightweight search
 *     index intentionally doesn't carry, and faking them here would mean
 *     either a real per-click fetch (defeating the whole point of a
 *     client-only-filtered index) or non-functional buttons that look
 *     real but do nothing — both worse than a clear, honest "View" that
 *     takes you to the one place those actions genuinely work.
 */
export function OverviewSearchBar({ index }: { index: SearchIndexEntry[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
          setExpandedId(null);
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
            results.map((r) => {
              const isExpanded = expandedId === r.id;
              return (
                <div className={`askbar-result${isExpanded ? " askbar-result-expanded" : ""}`} key={r.id}>
                  <div className="askbar-result-row">
                    <span className="askbar-result-category">{r.category}</span>
                    <span className="askbar-result-main">
                      <span className="askbar-result-title">{r.title}</span>
                      {r.subtitle && <span className="askbar-result-subtitle">{r.subtitle}</span>}
                    </span>
                    <span className="askbar-result-actions">
                      {r.detail && (
                        <button
                          type="button"
                          className="askbar-icon-btn"
                          aria-label={isExpanded ? "Hide details" : "Show details"}
                          aria-expanded={isExpanded}
                          onMouseDown={(e) => e.preventDefault()} // keep focus on input, don't trigger the blur-close
                          onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        >
                          <Info size={15} aria-hidden />
                        </button>
                      )}
                      <Link
                        href={r.href}
                        className="askbar-icon-btn"
                        aria-label={`View ${r.title}`}
                        title="View"
                      >
                        <ArrowUpRight size={15} aria-hidden />
                      </Link>
                    </span>
                  </div>
                  {isExpanded && r.detail && <p className="askbar-result-detail">{r.detail}</p>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
