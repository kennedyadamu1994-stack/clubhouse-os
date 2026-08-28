"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Info, ArrowUpRight } from "lucide-react";
import { ActionPopup, type ActionOption } from "./action-popup";

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
  /** One extra line shown when a result is expanded via the Info button — a description/summary already available on the entity, not a new fetch. Omitted for entities with nothing more to show than title/subtitle (e.g. Tools). */
  detail?: string;
  /**
   * Real, working action button(s) for this exact result (28 Aug —
   * Kennedy: "I want the search results to all come with the info button
   * and action button", correcting the earlier View-only version).
   * Built server-side using each category's real action_key/token_cost —
   * the same logic each Outreach/Workspace page already runs per entity,
   * duplicated into the index builder rather than fetched on demand,
   * since a category's action shape (which action_key, what it costs) is
   * fixed and cheap to compute upfront; only the label text varies per
   * entity, and that's already free to include. Omitted for categories
   * with no action at all (FAQ, Trending, Tool) — those keep the plain
   * View link instead.
   */
  actions?: ActionOption[];
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
 * actions"). First built as Info + a plain "View" navigation link, then
 * corrected (28 Aug, same day) after Kennedy clarified he wanted a real
 * working action button, not just a link to go find one:
 *   - Info: expands the row in place to show `detail` (a description/
 *     summary already in the index) — a genuine compact preview, no
 *     navigation, no extra fetch.
 *   - Action: opens the real ActionPopup for that exact entry, using the
 *     same action_key/token_cost/label logic each entity's own Outreach/
 *     Workspace page already runs — a genuinely working button, not a
 *     link to go find one. Categories with no action at all (FAQ,
 *     Trending, Tool) show a plain "View" link to their page instead,
 *     since there's nothing to act on.
 */
export function OverviewSearchBar({
  index,
  clubToken,
  club_id,
  isFirstTokenEncounter,
}: {
  index: SearchIndexEntry[];
  clubToken: string;
  club_id: string;
  isFirstTokenEncounter: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionEntry, setActionEntry] = useState<SearchIndexEntry | null>(null);
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
                      {r.actions && r.actions.length > 0 ? (
                        <button
                          type="button"
                          className="btn btn-pink askbar-action-btn"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setActionEntry(r)}
                          title={r.actions.length > 1 ? "See all options" : undefined}
                        >
                          {(() => {
                            // Button label shows the primary (pink, cost-bearing)
                            // action's text — clicking it opens the full
                            // options set below (ActionPopup), so a black
                            // "visit website"-style option some entries also
                            // have is never dropped, just reached via the
                            // same single click rather than a second button
                            // this tight row has no room for.
                            const primary = r.actions.find((a) => a.colour === "pink") ?? r.actions[0];
                            return primary.token_cost > 0
                              ? `${primary.label} · ${primary.token_cost} token${primary.token_cost === 1 ? "" : "s"}`
                              : primary.label;
                          })()}
                        </button>
                      ) : (
                        <Link href={r.href} className="askbar-icon-btn" aria-label={`View ${r.title}`} title="View">
                          <ArrowUpRight size={15} aria-hidden />
                        </Link>
                      )}
                    </span>
                  </div>
                  {isExpanded && r.detail && <p className="askbar-result-detail">{r.detail}</p>}
                </div>
              );
            })
          )}
        </div>
      )}
      {actionEntry && actionEntry.actions && (
        <ActionPopup
          clubToken={clubToken}
          club_id={club_id}
          entryId={actionEntry.id}
          entryTitle={actionEntry.title}
          options={actionEntry.actions}
          isFirstTokenEncounter={isFirstTokenEncounter}
          onClose={() => setActionEntry(null)}
        />
      )}
    </div>
  );
}
