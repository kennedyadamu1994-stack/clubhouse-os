"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import type { ScoredItem } from "@/lib/players/for-you-scoring";
import { matchBadgeClass } from "@/lib/players/for-you-scoring";
import { PlayerFavouriteHeart } from "./player-favourite-heart";
import { StarRating } from "./star-rating";
import { buildDetailRows } from "./player-entry-card";

/**
 * "For You" result card — same EntryCard-style row as PlayerEntryCard
 * (components/player-entry-card.tsx) for visual consistency across POS
 * (Kennedy, 15 Sep), with the two things unique to a scored
 * recommendation: the real match-percentage badge and the reasons
 * string, both read straight from ScoredItem (lib/players/
 * for-you-scoring.ts) — the direct port of the attached widget's own
 * scoreToPercent/reasons — not recomputed here. StarRating (16 Sep)
 * added the same way as PlayerEntryCard's own — a genuinely different,
 * complementary signal from match %: quality/verification of the
 * listing itself, not how well it fits this specific player. Reads
 * item.credibilityScore, not item.rating (17 Sep fix — see
 * PlayerEntryCard's own doc comment for the full reasoning: these are
 * two real, separately-existing fields, not the same thing renamed).
 *
 * REVISED (17 Sep) — reuses PlayerEntryCard's own buildDetailRows
 * (exported from that file rather than duplicated here) for the same
 * bold-label detail rows, plus real Sponsored/Verified badges, same
 * reasoning and CSS classes as PlayerEntryCard's own detail panel.
 * "For You" is always Activities-only (the scoring engine's own real
 * scope — see lib/players/for-you-scoring.ts), so buildDetailRows'
 * category switch always takes the Activities branch here.
 */
export function ForYouCard({ scored, rank }: { scored: ScoredItem; rank: number }) {
  const { item, pct, reasons } = scored;
  const [detailOpen, setDetailOpen] = useState(false);
  const detailId = `for-you-detail-${item.id}`;
  const metaBits = [item.type, item.location || item.borough, item.dayOfWeek, item.startTime].filter(Boolean);
  const linkUrl = item.booking || item.website;
  const detailRows = buildDetailRows(item);
  const reasonText = reasons.length
    ? reasons.map((r, i) => (i === 0 ? <em key={i}>{r}</em> : <span key={i}> · {r}</span>))
    : null;

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
        <div className="entry-title" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {rank <= 3 && <span style={{ color: "var(--pink)", fontSize: "0.78rem", fontWeight: 700 }}>#{rank}</span>}
          {item.name}
          <span className={`match-badge ${matchBadgeClass(pct)}`}>{pct}% match</span>
        </div>
        <div className="entry-meta">
          {metaBits.length > 0 && <span className="entry-sub">{metaBits.join(" · ")}</span>}
        </div>
        {reasonText && <p className="for-you-reason">{reasonText}</p>}
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
              <strong>{d.label}:</strong> {d.value}
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
