"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import type { Item, Category } from "@/components/nbrh-engine";
import { PlayerFavouriteHeart } from "./player-favourite-heart";
import { StarRating } from "./star-rating";

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
 * of FavouriteHeart's club-scoped one. StarRating (16 Sep, Kennedy:
 * "based on how the CHOS Star system works, can you add that to the
 * POS as well") reused directly — it already takes a plain score, no
 * club coupling at all — same placement in the expanded detail panel
 * as CHOS's own real .entry-detail-rating. Kennedy confirmed (17 Sep)
 * stars should stay inside the expanded panel like CHOS, not move onto
 * the always-visible collapsed row.
 *
 * REVISED AGAIN (17 Sep) — reads item.credibilityScore now, NOT
 * item.rating. Kennedy asked directly whether POS's stars were
 * genuinely the same field as CHOS's own universal credibility_score
 * system — they weren't: item.rating is a real, different, pre-
 * existing field (numeric_rating/rating/user_rating, an older Search-
 * only feature this Engine already used for min-rating filters and
 * sort-by-rating before credibility_score existed at all), still used
 * for those exact things elsewhere in this file, untouched. Item's own
 * credibilityScore field (added 17 Sep) is the real, separate
 * credibility_score column StarRating was actually built for. Absent
 * for Activities (Core Sessions has no such column — same honest
 * absence as item.rating's own 0 there), present for Clubs/Leagues/
 * Venues/People via the same real column CHOS's own universal system
 * already reads.
 *
 * REVISED (17 Sep, Kennedy: attached a real CHOS detail-panel
 * screenshot — "having some bold text categories and the category
 * detail/description next to it... Use badges as well where
 * relevant") — the expanded panel now shows real Sponsored/Verified
 * badges (same entry-badge-* classes/colours EntryCard's own real
 * badges use) plus a genuine set of bold-label detail rows built per
 * category from Item's own real fields, not just a bare Description
 * line. buildDetailRows below picks the fields that are actually
 * meaningful for each category (Activities care about difficulty/
 * price/audience; Venues care about parking/courts/indoor; People
 * care about specialisation/experience — a generic dump of every
 * Item field regardless of category would just be noise for most of
 * them), matching the real intent behind Kennedy's reference image
 * rather than reproducing it as a fixed field list.
 */
export interface DetailRow {
  label: string;
  value: string;
  /** Optional URL — when set, the row's own render (in PlayerEntryCard/ForYouCard) shows value as a real link instead of plain text, matching EntryCard's own EntryDetailField.href pattern. */
  href?: string;
}

export function buildDetailRows(item: Item): DetailRow[] {
  const rows: DetailRow[] = [];
  const push = (label: string, value: string | number | undefined, href?: string) => {
    if (value === undefined || value === "" || value === 0) return;
    rows.push({ label, value: String(value), href });
  };

  switch (item.category as Category) {
    case "Activities":
      // Kennedy's own explicit real field list (17 Sep) — every one of
      // these already reads a real, confirmed column via mapActivity
      // (components/nbrh-engine.tsx); this branch previously only
      // surfaced a small subset (Type/Difficulty/Audience/Day/Time/
      // Price). "Total Price" appeared twice on Kennedy's list — shown
      // once here, not duplicated. Club Hub URL renders as a real link
      // rather than plain text, matching how EntryCard's own optional
      // href field works for detail rows elsewhere in this app.
      push("Activity Type", item.type);
      push("Club", item.club);
      push("Class Name", item.name);
      push("Date", item.date);
      push("Start Time", item.startTime);
      push("End Time", item.endTime);
      push("Days", item.dayOfWeek);
      push("Duration", item.duration > 0 ? `${item.duration} minutes` : undefined);
      push("Address", item.address);
      push("Location", item.location);
      push("Total Price", item.price > 0 ? `£${item.price.toFixed(2)}` : "Free");
      push("Difficulty Level", item.difficulty);
      push("Age Group", item.ageGroup);
      push("Equipment Provided", item.equipmentProvided ? "Yes" : "No");
      push("Cancellation Hours", item.cancelHours > 0 ? `${item.cancelHours} hours` : undefined);
      push("Indoor/Outdoor", item.indoor ? "Indoor" : "Outdoor");
      push("Badge", item.badge);
      push("Audience", item.audience);
      push("Vibe", item.vibe);
      if (item.clubHub) push("Club Hub", "View Club Hub", item.clubHub);
      break;
    case "Clubs":
    case "Leagues":
      push("Type", item.type);
      push("Audience", item.audience);
      push("Vibe", item.vibe);
      if (item.priceText) push("Cost", item.priceText);
      break;
    case "Venues":
      push("Type", item.type);
      push("Indoor/Outdoor", item.indoor ? "Indoor" : "Outdoor");
      push("Courts/Pitches", item.courts);
      push("Parking", item.parking);
      push("Price", item.price > 0 ? `£${item.price.toFixed(2)}/hr` : undefined);
      break;
    case "People":
      push("Type", item.type);
      push("Sport", item.sport);
      push("Specialisation", item.specialisation);
      push("Experience", item.experienceYears ? `${item.experienceYears} years` : undefined);
      push("Availability", item.availability);
      push("Price", item.price > 0 ? `£${item.price.toFixed(2)}/hr` : undefined);
      break;
    default:
      push("Type", item.type);
      push("Location", item.location);
  }

  return rows;
}

export function PlayerEntryCard({ item }: { item: Item }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const detailId = `player-entry-detail-${item.id}`;
  const metaBits = [item.type, item.location || item.borough, item.sport].filter(Boolean);
  const linkUrl = item.booking || item.website;
  const detailRows = buildDetailRows(item);

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
          {(item.sponsored || item.verified) && (
            <div className="entry-detail-chips">
              {item.sponsored && <span className="entry-badge entry-badge-sponsored">Sponsored</span>}
              {item.verified && (
                <span className="entry-badge entry-badge-verified">
                  <BadgeCheck size={12} aria-hidden />
                  Verified
                </span>
              )}
            </div>
          )}
          {item.credibilityScore != null && (
            <div className="entry-detail-rating">
              <strong>Quality Rating:</strong> <StarRating score={item.credibilityScore} />
            </div>
          )}
          {detailRows.map((d) => (
            <div key={d.label}>
              <strong>{d.label}:</strong>{" "}
              {d.href ? (
                <a href={d.href} target="_blank" rel="noopener noreferrer">
                  {d.value}
                </a>
              ) : (
                d.value
              )}
            </div>
          ))}
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
