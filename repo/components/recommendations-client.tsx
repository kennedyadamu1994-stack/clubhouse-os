"use client";

import { useEffect, useState } from "react";
import type { Player } from "@/lib/types";
import { buildRecommendations, type Recommendation } from "@/lib/players/recommendations";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";
import { RecommendationCard } from "@/components/recommendation-card";
import { EmptyState } from "@/components/empty-state";

/**
 * Client half of Recommendations — the actual data fetch has to happen
 * here, not in the server page that renders this, since
 * buildRecommendations calls fetchCategoryItems, which is client-only
 * (fetches directly from opensheet.elk.sh, same as NbrhEngine's own
 * Search does — see that function's own doc comment). The player's
 * profile itself is looked up server-side, in the thin page wrapper
 * (app/players/[playerToken]/recommendations/page.tsx), and passed in
 * as a plain prop.
 */
export function RecommendationsClient({ player, playerToken }: { player: Player; playerToken: string }) {
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await buildRecommendations(player);
        if (!cancelled) setRecs(result);
      } catch {
        if (!cancelled) setError("Could not load recommendations. Check your connection and try refreshing.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- player is this page's own server-fetched prop, stable for the life of this mount; re-running on a reference change that never happens would just refetch identically
  }, []);

  if (error) {
    return (
      <div className="sr-card-hero">
        <span className="sr-lbl">Error</span>
        <p className="sr-body">{error}</p>
      </div>
    );
  }

  if (recs === null) {
    return (
      <div className="sr-loading">
        <div className="sr-spin" />
        <p style={{ color: "var(--faint-text)", fontSize: "0.85rem" }}>Finding your matches…</p>
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <EmptyState
        message="No strong matches yet — the more your profile fills in, the better these get. Try Search in the meantime."
        cta="Browse Search"
        href={`/players/${playerToken}/search`}
      />
    );
  }

  const entries: OutreachEntry[] = recs.map((r) => ({
    key: r.item.id,
    searchText: [r.item.name, r.item.type, r.item.location, r.item.borough, r.item.sport].join(" "),
    filterValues: { category: r.item.category },
    sortValues: { match: r.chips.length },
    nameForSort: r.item.name,
    card: <RecommendationCard key={r.item.id} item={r.item} chips={r.chips} />,
  }));

  const categories = Array.from(new Set(recs.map((r) => r.item.category))).sort();

  return (
    <OutreachList
      entries={entries}
      placeholder="Search your recommendations…"
      filters={[{ key: "category", label: "Category", values: categories }]}
      sortOptions={[
        { key: "match", label: "Best match" },
        { key: "name", label: "Name (A–Z)" },
      ]}
      defaultSort="match"
    />
  );
}
