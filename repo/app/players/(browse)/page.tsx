"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Public POS Home — now lives at /players itself, inside the full
 * shell ((browse) layout: header, sidebar, tab bar, footer), not a
 * separate minimal landing page (15 Sep restructure — Kennedy: "this
 * page shouldn't exist at all & should immediately show the full
 * sidebar/tab-bar shell instead of this minimal landing content").
 * The old app/players/page.tsx (outside the (browse) group,
 * deliberately minimal) is gone; this file at app/players/(browse)/
 * page.tsx is what /players now renders.
 *
 * Mirrors app/players/[playerToken]/page.tsx (the personal Home) almost
 * exactly — same search-bar-only focus, same light-search deep-link
 * behaviour (builds a ?q= URL, doesn't search anything itself; Search
 * itself, app/players/(browse)/search/[category]/page.tsx, is what
 * reads it) — just without a token in the built URL.
 */
export default function PublicHome() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    const target = `/players/search${q ? `?q=${encodeURIComponent(q)}` : ""}`;
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
