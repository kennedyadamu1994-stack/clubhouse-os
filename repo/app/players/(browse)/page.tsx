"use client";

import { useEffect, useState } from "react";
import { searchAllCategories, type HomeSearchResult } from "@/lib/players/home-search";
import { PlayerEntryCard } from "@/components/player-entry-card";

/**
 * Public POS Home — lives at /players itself, inside the full shell
 * ((browse) layout: header, sidebar, tab bar, footer, header carousel).
 *
 * Live, in-place cross-category search (15 Sep rewrite — Kennedy: "the
 * search bar on the home page needs to work exactly like the CHOS
 * search bar, where everything is searchable in that search window,"
 * then clarified further: keep a separate box on Home, but make it
 * filter live in place rather than navigating away). Typing here calls
 * searchAllCategories (lib/players/home-search.ts), which searches
 * Activities/Clubs/Leagues/Venues/Events/People together — something
 * Search's own per-category NbrhEngine never does, since its own
 * search box only ever filters within whichever one category tab is
 * currently active. Debounced 300ms, matching the timing the real
 * standalone widget's own search input used.
 *
 * Reuses PlayerEntryCard (components/player-entry-card.tsx), the same
 * CHOS EntryCard-style row used on Search, for visual consistency
 * across every POS list/browse view (15 Sep — Kennedy: "present the
 * NBRH engine and any other relevant piece of data like the CHOS").
 */
export default function PublicHome() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HomeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const r = await searchAllCategories(trimmed);
      setResults(r);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="card outreach-card" style={{ textAlign: "center", padding: "56px 24px 40px" }}>
      <h2 style={{ marginBottom: 8 }}>Find your next session</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 28, maxWidth: "48ch", marginLeft: "auto", marginRight: "auto" }}>
        Search activities, clubs, leagues, venues, people, and events across The NBRH.
      </p>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="sr-search-wrap" style={{ maxWidth: "none" }}>
          <input
            type="text"
            className="sr-search-input"
            placeholder="Search football sessions in Hackney…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button type="button" className="sr-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
      </div>

      {query.trim() && (
        <div style={{ textAlign: "left", marginTop: 28, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
          {loading ? (
            <div className="sr-loading">
              <div className="sr-spin" />
            </div>
          ) : results.length === 0 ? (
            <p style={{ color: "var(--dim)", textAlign: "center", fontSize: "0.9rem" }}>
              No results for &quot;{query.trim()}&quot;.
            </p>
          ) : (
            <div className="entry-list">
              {results.map((r) => (
                <PlayerEntryCard key={r.item.id} item={r.item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
