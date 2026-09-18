"use client";

import { useState } from "react";
import type { Opportunity } from "@/lib/types";
import { StarRating } from "./star-rating";

/**
 * POS Jobs card — a dedicated component rather than a reuse of
 * EntryCard (components/entry-card.tsx), which is unconditionally
 * built around clubToken/club_id (ActionPopup's token-spend flow,
 * FavouriteHeart's club-scoped favouriting) — neither applies to an
 * opportunity, which has no token economy at all and just needs an
 * "Apply" link. Reuses the same generic entry-row/entry-detail CSS
 * classes and StarRating component EntryCard already relies on, so it
 * looks consistent without inheriting the club-only machinery.
 *
 * No favourite heart yet (15 Sep) — player favourites aren't wired up
 * as their own data layer yet (same open item as Inbox), so this is
 * deliberately left out here rather than faked, ready to slot in once
 * that exists for the personal token'd Jobs route.
 */
export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const detailId = `opp-detail-${opportunity.opportunity_id}`;

  const metaBits = [opportunity.type, opportunity.provider, opportunity.area].filter(Boolean);

  return (
    <div className={`entry-row ${opportunity.sponsored ? "entry-row-sponsored" : ""}`}>
      <span className="entry-avatar" aria-hidden>
        {opportunity.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- per-entry external photo, not a static asset
          <img src={opportunity.image_url} alt="" />
        ) : (
          opportunity.title.slice(0, 2).toUpperCase()
        )}
      </span>

      <div className="entry-main">
        <div className="entry-title">{opportunity.title}</div>
        <div className="entry-meta">
          {metaBits.length > 0 && <span className="entry-sub">{metaBits.join(" · ")}</span>}
          {opportunity.paid && <span className="chip">Paid</span>}
          {opportunity.dbs_required && <span className="chip">DBS required</span>}
          {opportunity.sports.map((s) => (
            <span className="chip" key={s}>
              {s}
            </span>
          ))}
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
        {opportunity.apply_url ? (
          <a href={opportunity.apply_url} target="_blank" rel="noopener noreferrer" className="btn btn-pink">
            Apply
          </a>
        ) : (
          <a href={`mailto:${opportunity.contact_email}`} className="btn btn-pink">
            Contact
          </a>
        )}
      </div>

      {detailOpen && (
        <div className="entry-detail" id={detailId}>
          {(opportunity.sponsored || opportunity.status) && (
            <div className="entry-detail-chips">
              {opportunity.sponsored && <span className="entry-badge entry-badge-sponsored">Sponsored</span>}
              {opportunity.status && <span className="entry-badge">{opportunity.status}</span>}
            </div>
          )}
          {opportunity.credibility_score != null && (
            <div className="entry-detail-rating">
              <strong>Quality Rating:</strong> <StarRating score={opportunity.credibility_score} />
            </div>
          )}
          {opportunity.description && (
            <div>
              <strong>Description:</strong> {opportunity.description}
            </div>
          )}
          {opportunity.requirements && (
            <div>
              <strong>Requirements:</strong> {opportunity.requirements}
            </div>
          )}
          {opportunity.experience_level && (
            <div>
              <strong>Experience level:</strong> {opportunity.experience_level}
            </div>
          )}
          {opportunity.frequency && (
            <div>
              <strong>Frequency:</strong> {opportunity.frequency}
            </div>
          )}
          {opportunity.hours_per_week && (
            <div>
              <strong>Hours per week:</strong> {opportunity.hours_per_week}
            </div>
          )}
          {opportunity.start_date && (
            <div>
              <strong>Start date:</strong> {opportunity.start_date}
            </div>
          )}
          {opportunity.closing_date && (
            <div>
              <strong>Deadline:</strong> {opportunity.closing_date}
            </div>
          )}
          {opportunity.contact_name && (
            <div>
              <strong>Contact:</strong> {opportunity.contact_name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
