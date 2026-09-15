"use client";

import { useState } from "react";
import type { Item } from "@/components/nbrh-engine";
import type { ReasonChip } from "@/lib/relevance";
import { ReasonChips } from "./reason-chips";

/**
 * Recommendations card — a dedicated component, same reasoning as
 * OpportunityCard (components/opportunity-card.tsx): Item (the NBRH
 * Engine's own data shape, exported 15 Sep) doesn't map onto
 * EntryCard's club-coupled props (clubToken/club_id, ActionPopup's
 * token spend, FavouriteHeart's club-scoped favouriting) any more
 * cleanly than Opportunity did, and a recommendation has no "get in
 * touch" action at all — just a link to view or book the real thing.
 * Uses the same expand/collapse "i" button pattern every other card in
 * this app uses (EntryCard, OpportunityCard), for visual consistency.
 */
export function RecommendationCard({ item, chips }: { item: Item; chips: ReasonChip[] }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const detailId = `rec-detail-${item.id}`;
  const metaBits = [item.type, item.location || item.borough, item.sport].filter(Boolean);
  const linkUrl = item.booking || item.website;

  return (
    <div className="entry-row">
      <span className="entry-avatar" aria-hidden>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- per-entry external photo, not a static asset
          <img src={item.image} alt="" />
        ) : (
          item.name.slice(0, 2).toUpperCase()
        )}
      </span>

      <div className="entry-main">
        <div className="entry-title">{item.name}</div>
        <div className="entry-meta">
          {metaBits.length > 0 && <span className="entry-sub">{metaBits.join(" · ")}</span>}
        </div>
      </div>

      <div className="entry-actions">
        <button
          className="eye-btn"
          aria-expanded={detailOpen}
          aria-controls={detailId}
          aria-label={detailOpen ? "Hide details" : "Show details"}
          onClick={() => setDetailOpen((v) => !v)}
        >
          i
        </button>
        {linkUrl && (
          <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="btn btn-pink">
            View
          </a>
        )}
      </div>

      {detailOpen && (
        <div className="entry-detail" id={detailId}>
          {chips.length > 0 && (
            <div className="entry-detail-chips">
              <ReasonChips chips={chips} />
            </div>
          )}
          {item.description && (
            <div>
              <strong>Description:</strong> {item.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
