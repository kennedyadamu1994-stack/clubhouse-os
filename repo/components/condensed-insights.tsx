"use client";

import { useEffect, useState } from "react";
import { fetchCategoryItems } from "@/components/nbrh-engine";

/**
 * "Condensed Search insights" for Home (15 Sep, Kennedy: replace Home's
 * search box with a set of dropdowns, one being condensed Search
 * insights). A genuinely new, small component — not a stripped-down
 * version of CHOS's own SessionInsights (components/session-insights.tsx,
 * 664 lines, deeply self-contained state/filter logic) — Kennedy
 * confirmed (15 Sep) this substitute is fine rather than risk modifying
 * that real, working CHOS component for a "condensed" mode it was never
 * built to support. Computes a handful of real headline numbers fresh
 * from the same real data source (fetchCategoryItems("Activities"),
 * the same Core Sessions fetch Search's own Activities tab uses) —
 * genuinely real numbers, not invented placeholder content.
 */
interface Stats {
  activeCount: number;
  topSport: string | null;
  topBorough: string | null;
  avgPrice: number | null;
}

function topByCount(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

export function CondensedInsights() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCategoryItems("Activities")
      .then((items) => {
        if (cancelled) return;
        const prices = items.map((i) => i.price).filter((p) => p > 0);
        setStats({
          activeCount: items.length,
          topSport: topByCount(items.map((i) => i.type)),
          topBorough: topByCount(items.map((i) => i.location)),
          avgPrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
        });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p style={{ color: "var(--dim)", fontSize: "0.85rem" }}>Could not load insights right now.</p>;
  }

  if (!stats) {
    return (
      <div className="sr-loading">
        <div className="sr-spin" />
      </div>
    );
  }

  return (
    <div className="condensed-insights-grid">
      <div className="condensed-insight-stat">
        <span className="condensed-insight-value">{stats.activeCount}</span>
        <span className="condensed-insight-label">Active sessions</span>
      </div>
      <div className="condensed-insight-stat">
        <span className="condensed-insight-value">{stats.topSport ?? "—"}</span>
        <span className="condensed-insight-label">Most common sport</span>
      </div>
      <div className="condensed-insight-stat">
        <span className="condensed-insight-value">{stats.topBorough ?? "—"}</span>
        <span className="condensed-insight-label">Most active borough</span>
      </div>
      <div className="condensed-insight-stat">
        <span className="condensed-insight-value">{stats.avgPrice != null ? `£${stats.avgPrice.toFixed(0)}` : "—"}</span>
        <span className="condensed-insight-label">Average price</span>
      </div>
    </div>
  );
}
