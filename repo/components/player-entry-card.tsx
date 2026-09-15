"use client";

import { useState } from "react";
import type { Item } from "@/components/nbrh-engine";
import { PlayerFavouriteHeart } from "./player-favourite-heart";

/**
 * Visual redesign (15 Sep, Kennedy: "present the NBRH engine and any
 * other relevant piece of data like the CHOS please... It'll mean a
 * redesign but that's how I want it") — replaces RecommendationCard's
 * plain layout for Search/browse results with the real CHOS EntryCard
 * look: image thumbnail, title, subtitle, a heart, an info toggle, and
 * a CTA button, matching Kennedy's own screenshot of CHOS's Clubs
 * Outreach page exactly.
 *
 * Still a dedicated component, not EntryCard itself made to work here
 * — EntryCard's actions/ActionPopup system is a token-spend "get in
 * touch" flow (clubToken/club_id baked in throughout), which doesn't
 * exist for a player browsing Search at all. This mirrors EntryCard's
 * real markup/CSS classes (entry-row, entry-avatar, entry-title,
 * entry-actions, eye-btn, entry-detail) for visual parity, with a
 * direct "View" link instead of "View options" (there's no popup to
 * open — being honest about what the button actually does), and
 * PlayerFavouriteHeart (the email-identity favourite system) instead
 * of FavouriteHeart's club-scoped one.
 */
export function PlayerEntryCard({ item }: { item: Item }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const detailId = `player-entry-detail-${item.id}`;
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
        <PlayerFavouriteHeart
          category={item.category}
          item_id={item.id}
          title={item.name}
          subtitle={metaBits.join(" · ")}
          href={linkUrl ?? ""}
        />
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
