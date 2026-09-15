"use client";

import { useEffect, useState } from "react";
import { searchAllCategories, type HomeSearchResult } from "@/lib/players/home-search";
import { PlayerEntryCard } from "@/components/player-entry-card";

/**
 * Personal Home — live, in-place cross-category search (15 Sep rewrite
 * — see app/players/(browse)/page.tsx's own doc comment for the full
 * reasoning: Kennedy wanted Home's search box to work "exactly like
 * the CHOS search bar," then clarified that means live filtering in
 * place, across every category at once, not a deep-link to Search's
 * own single-category-at-a-time view). Identical to the public Home
 * page's own implementation, including the same hero redesign (15 Sep,
 * Kennedy: "the home page needs to feel more grand") — the only
 * difference is this one lives under a real player token, and the
 * layout above it (app/players/[playerToken]/layout.tsx) already shows
 * a personal "Hey, {name}" greeting in the deck header, so this hero's
 * own headline stays generic rather than repeating the player's name a
 * second time right below it.
 */
export default function PlayerHome() {
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
    <div style={{ textAlign: "center", padding: "72px 24px 48px" }}>
      <p className="eyebrow" style={{ marginBottom: 14 }}>
        The Neighbourhood
      </p>
      <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 400, fontSize: 44, lineHeight: 1.15, letterSpacing: "-0.01em", marginBottom: 18 }}>
        Find your <em style={{ color: "var(--pink)", fontStyle: "normal" }}>next session</em>
      </h1>
      <p style={{ color: "var(--dim)", fontSize: "1.02rem", marginBottom: 36, maxWidth: "52ch", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
        Search activities, clubs, leagues, venues, people, and events across The NBRH — free, always.
      </p>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="sr-search-wrap" style={{ maxWidth: "none" }}>
          <input
            type="text"
            className="sr-search-input"
            placeholder="Search football sessions in Hackney…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{ padding: "14px 34px 14px 18px", fontSize: "1.05rem" }}
          />
          {query && (
            <button type="button" className="sr-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
      </div>

      {query.trim() && (
        <div className="card outreach-card" style={{ textAlign: "left", marginTop: 36, maxWidth: 800, marginLeft: "auto", marginRight: "auto", padding: "24px 28px" }}>
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
