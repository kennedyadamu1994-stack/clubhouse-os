"use client";

import { useState } from "react";
import type { TrendingSourceType, ContentAngle } from "@/lib/types";

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
  contentAngle: ContentAngle;
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
 * Desk" component into the dashboard's existing dark/pink theme (Kennedy's
 * instruction, 19 Aug: combine the styling, don't replace it). Keeps the
 * reference's core ideas — source-type tag, expandable score breakdown,
 * dashed "content angle" callout, thumbnail — dropped only the search bar
 * (removed at the page level) and the newspaper-stamp visual language,
 * which doesn't fit this app's existing card system.
 *
 * "why_it_matters" (the app's original, club-specific framing) is kept
 * inline and undimmed — it's the one piece of the original Trending cards
 * that's genuinely more valuable than the reference component's generic
 * "why this scored well" note, so both are shown: whyItMatters up front,
 * the score's own reasoning inside the expandable breakdown.
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
  contentAngle,
  thumbnailUrl,
}: TrendingCardProps) {
  const [expanded, setExpanded] = useState(false);
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

        <button
          type="button"
          className="trending-expand-btn"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          {expanded ? "Hide score breakdown ▲" : "Show score breakdown ▼"}
        </button>

        {expanded && (
          <div className="trending-breakdown">
            <div className="trending-breakdown-row">
              <span className="trending-breakdown-label">Trending</span>
              <div className="trending-bar-track">
                <div className="trending-bar-fill trending-bar-trending" style={{ width: `${trendingScore}%` }} />
              </div>
              <span className="trending-breakdown-num">{trendingScore}</span>
            </div>
            <div className="trending-breakdown-row">
              <span className="trending-breakdown-label">Interest</span>
              <div className="trending-bar-track">
                <div className="trending-bar-fill trending-bar-interest" style={{ width: `${interestScore}%` }} />
              </div>
              <span className="trending-breakdown-num">{interestScore}</span>
            </div>
          </div>
        )}

        <div className="trending-angle">
          <div className="trending-angle-header">
            <span className="trending-angle-pin" aria-hidden>
              ✎
            </span>
            <span className="trending-angle-kicker">Content angle</span>
          </div>
          <div className="trending-angle-title">{contentAngle.title}</div>
          <div className="trending-angle-medium">{contentAngle.medium}</div>
        </div>

        <a className="btn btn-black trending-card-read" href={url} target="_blank" rel="noopener noreferrer">
          Read the full story
        </a>
      </div>
    </article>
  );
}
