"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Home (Kennedy, 15 Sep): "the main focus should be the search bar...
 * that should work as the CHOS one does" — CHOS has no single search
 * bar of its own to copy (its closest equivalent is the NBRH Engine's
 * own in-component search input, components/nbrh-engine.tsx), so this
 * reuses that exact input markup/classes (sr-search-wrap/sr-search-input)
 * rather than inventing new styling, which would drift from it visually.
 *
 * Deliberately a LIGHT search (Kennedy, 15 Sep, choosing between a
 * unified cross-entity index and this): typing a query and submitting
 * just deep-links to Search with that query pre-filled via a URL param
 * — it doesn't search anything itself. Search (app/players/
 * [playerToken]/search/[category]/page.tsx) is what actually reads the
 * query param and runs it against the real data.
 */
export default function PlayerHome({ params }: { params: { playerToken: string } }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    const target = `/players/${params.playerToken}/search/activities${q ? `?q=${encodeURIComponent(q)}` : ""}`;
    router.push(target);
  }

  return (
    <div className="card outreach-card" style={{ textAlign: "center", padding: "56px 24px" }}>
      <h2 style={{ marginBottom: 8 }}>Find your next session</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 28, maxWidth: "48ch", marginLeft: "auto", marginRight: "auto" }}>
        Search activities, clubs, leagues, venues, people, jobs, and events across The NBRH.
      </p>
      <form onSubmit={handleSubmit} style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
        <div className="sr-search-wrap" style={{ flex: 1, maxWidth: "none" }}>
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
        <button type="submit" className="btn btn-pink">
          Search
        </button>
      </form>
    </div>
  );
}
