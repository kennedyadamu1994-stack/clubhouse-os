"use client";

import { useMemo, useState } from "react";
import type { TrendingSourceType, TrendingTopic } from "@/lib/types";
import { TrendingCard } from "@/components/trending-card";

interface TrendingBoardProps {
  topics: TrendingTopic[];
  categoryLabels: Record<string, string>;
}

type SortKey = "buzz" | "recency" | "sourceType";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "buzz", label: "Buzz score" },
  { key: "recency", label: "Most recent" },
  { key: "sourceType", label: "Source type" },
];

const SOURCE_TYPE_FILTER_LABEL: Record<TrendingSourceType | "all", string> = {
  all: "All",
  news: "News",
  forum: "Forum",
  event: "Event",
  discussion: "Discussion",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Sort/filter shell for Trending Topics (Kennedy's instruction, 19 Aug: keep
 * sort, keep filter, keep the relevance/buzz score, remove the search bar
 * from his reference component entirely — this app already has a universal
 * search on Overview, a second one here would be redundant). Client-side
 * only since the underlying topic list is small and fully loaded already;
 * no re-fetch needed to sort/filter it.
 *
 * formatDate lives here, not passed as a prop from the server page — Next.js
 * cannot pass a plain function across the server/client component boundary
 * ("Functions cannot be passed directly to Client Components").
 */
export function TrendingBoard({ topics, categoryLabels }: TrendingBoardProps) {
  const [sortBy, setSortBy] = useState<SortKey>("buzz");
  const [filterType, setFilterType] = useState<TrendingSourceType | "all">("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: topics.length, news: 0, forum: 0, event: 0, discussion: 0 };
    topics.forEach((t) => {
      c[t.source_type] = (c[t.source_type] ?? 0) + 1;
    });
    return c;
  }, [topics]);

  const filteredSorted = useMemo(() => {
    let list = [...topics];
    if (filterType !== "all") {
      list = list.filter((t) => t.source_type === filterType);
    }
    if (sortBy === "buzz") {
      list.sort(
        (a, b) =>
          Math.round(b.trending_score * 0.5 + b.interest_score * 0.5) -
          Math.round(a.trending_score * 0.5 + a.interest_score * 0.5),
      );
    } else if (sortBy === "recency") {
      list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    } else if (sortBy === "sourceType") {
      list.sort((a, b) => a.source_type.localeCompare(b.source_type));
    }
    return list;
  }, [topics, sortBy, filterType]);

  return (
    <>
      <div className="trending-controls">
        <div className="trending-control-group">
          <span className="trending-control-label">Sort</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortBy(opt.key)}
              className={`trending-pill ${sortBy === opt.key ? "trending-pill-active" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="trending-control-group">
          <span className="trending-control-label">Filter</span>
          {(Object.keys(SOURCE_TYPE_FILTER_LABEL) as (TrendingSourceType | "all")[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterType(key)}
              className={`trending-pill ${filterType === key ? "trending-pill-active" : ""}`}
            >
              {SOURCE_TYPE_FILTER_LABEL[key]} ({counts[key] ?? 0})
            </button>
          ))}
        </div>
      </div>

      <div className="trending-list">
        {filteredSorted.map((t) => (
          <TrendingCard
            key={t.topic_id}
            headline={t.headline}
            source={t.source}
            categoryLabel={categoryLabels[t.category] ?? t.category}
            sourceType={t.source_type}
            publishedLabel={formatDate(t.published_at)}
            summary={t.summary}
            whyItMatters={t.why_it_matters}
            url={t.url}
            trendingScore={t.trending_score}
            interestScore={t.interest_score}
            contentAngle={t.content_angle}
            thumbnailUrl={t.thumbnail_url}
          />
        ))}
      </div>
    </>
  );
}
