"use client";

import type { TrendingSourceType } from "@/lib/types";

interface TrendingCardProps {
  headline: string;
  source: string;
  categoryLabel: string;
  sourceType: TrendingSourceType;
  publishedLabel: string;
  summary: string;
  whyItMatters: string;
  url: string;
  trendingScore: number;
  interestScore: number;
  thumbnailUrl: string;
}

const SOURCE_TYPE_LABEL: Record<TrendingSourceType, string> = {
  news: "News",
  forum: "Forum / Social",
  event: "Event",
  discussion: "Discussion / Op-ed",
};

/**
 * Buzz score = trending + interest, weighted 50/50 (same formula as
 * Kennedy's reference component). Banded into a label rather than shown as
 * a raw number alone, since "62" means nothing without context.
 */
function buzzScore(trending: number, interest: number): number {
  return Math.round(trending * 0.5 + interest * 0.5);
}

function tierForScore(score: number): { label: string; className: string } {
  if (score >= 75) return { label: "HOT", className: "trending-tier-hot" };
  if (score >= 55) return { label: "RISING", className: "trending-tier-rising" };
  if (score >= 35) return { label: "STEADY", className: "trending-tier-steady" };
  return { label: "QUIET", className: "trending-tier-quiet" };
}

/**
 * Trending Topics card — restyled from Kennedy's reference "Trending Topics
 * Desk" component into the dashboard's existing dark/pink theme (19 Aug).
 *
 * Content angle callout and the expandable score breakdown were removed for
 * every story (Kennedy, 20 Aug) — the buzz-score stamp on the thumbnail
 * stays, since that's the compact at-a-glance signal, not the thing that
 * was asked to go. No "expanded" state left in this component at all now
 * that the only thing it toggled is gone.
 *
 * "why_it_matters" (the app's original, club-specific framing) is kept —
 * it's the one piece of the original Trending cards that's genuinely more
 * useful than anything from the reference component.
 */
export function TrendingCard({
  headline,
  source,
  categoryLabel,
  sourceType,
  publishedLabel,
  summary,
  whyItMatters,
  url,
  trendingScore,
  interestScore,
  thumbnailUrl,
}: TrendingCardProps) {
  const score = buzzScore(trendingScore, interestScore);
  const tier = tierForScore(score);

  return (
    <article className="trending-card">
      <div className="trending-card-thumb">
        <img src={thumbnailUrl} alt="" loading="lazy" />
        <span className={`trending-stamp ${tier.className}`}>
          <span className="trending-stamp-score">{score}</span>
          <span className="trending-stamp-label">{tier.label}</span>
        </span>
      </div>

      <div className="trending-card-body">
        <div className="trending-card-meta">
          <span className="chip trending-card-category">{categoryLabel}</span>
          <span className="chip trending-card-sourcetype">{SOURCE_TYPE_LABEL[sourceType]}</span>
          <span className="trending-card-source">
            {source} · {publishedLabel}
          </span>
        </div>

        <h3 className="trending-card-headline">{headline}</h3>
        <p className="trending-card-summary">{summary}</p>

        <div className="trending-why">
          <span className="trending-why-label">Why it matters for you</span>
          <p>{whyItMatters}</p>
        </div>

        <a className="btn btn-black trending-card-read" href={url} target="_blank" rel="noopener noreferrer">
          Read the full story
        </a>
      </div>
    </article>
  );
}
