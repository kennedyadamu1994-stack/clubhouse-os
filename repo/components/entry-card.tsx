"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { ActionPopup, type ActionOption } from "./action-popup";
import { ReasonChips } from "./reason-chips";
import type { ReasonChip } from "@/lib/relevance";

export interface EntryDetailField {
  label: string;
  value: string;
}

interface EntryCardProps {
  clubToken: string;
  club_id: string;
  entryId: string;
  initials: string; // avatar letters — used as the placeholder when no image exists
  imageUrl?: string | null; // when present, shown instead of the initials placeholder
  title: string; // name (if consented) or a safe fallback like "Coach in Hackney"
  subtitle: string;
  tags: string[];
  /** v3 relevance chips (replaces the old 0-100 matchScore) — see lib/relevance.ts. Omit entirely for subsections that don't have chips (e.g. Sponsorship & Funding, Influencers, Opportunities). */
  reasonChips?: ReasonChip[];
  detail: EntryDetailField[]; // GDPR-safe fields only — never raw name/email/phone
  consentNote?: string; // shown when identifying info is withheld
  actions: ActionOption[];
  isFirstTokenEncounter: boolean;
  isNew?: boolean; // added within the last 7 days (created_at) — shown as a small badge, doesn't affect sort order
  sponsored?: boolean; // sort order (pinning to the top) is handled by OutreachList/the page — this only controls the row's own visual treatment
  /**
   * Real "verified" column from the entry's own source sheet (29 Aug —
   * Kennedy: "their original data sources might have a column that say
   * these data points are verified... implement a verified badge").
   * Only passed where a genuine verification column exists and is
   * already read into the entity's type — People (PEOPLE sheet's real
   * `verified` column, confirmed in docs/schema.md, newly wired 29 Aug)
   * and Clubs (ClubDirectoryEntry.verified, already wired from the real
   * `Verified?` column, previously only shown as plain text inside the
   * "i" detail panel rather than a visible badge on the row itself).
   * Other Outreach categories don't have a confirmed real verification
   * column, so this prop is simply omitted there rather than guessed at.
   */
  verified?: boolean;
  /** Passed straight through to ActionPopup — see its own doc comment (only Outreach → Clubs uses this, 20 Aug). */
  reasonOptions?: string[];
}

/**
 * Used across all six Outreach subsections (docs/components.md #1).
 * Rebuilt to match Kennedy's demo pattern directly: one plain row — avatar,
 * name, one line of context, tags, reason chips, actions. No collapse, no
 * toggle button, nothing hidden by default. The "i" button still exists for
 * the rare case where a field genuinely doesn't fit in the row (long
 * descriptions, GDPR consent notes) — but showing/hiding that little strip
 * is the only expand/collapse behaviour left, and it's opt-in per entry,
 * not a whole-card state.
 */
export function EntryCard({
  clubToken,
  club_id,
  entryId,
  initials,
  imageUrl,
  title,
  subtitle,
  tags,
  reasonChips,
  detail,
  consentNote,
  actions,
  isFirstTokenEncounter,
  isNew,
  sponsored,
  verified,
  reasonOptions,
}: EntryCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const detailId = `detail-${entryId}`;

  return (
    <div className={`entry-row ${sponsored ? "entry-row-sponsored" : ""}`}>
      <span className="entry-avatar" aria-hidden>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- per-entry external photo, not a static asset
          <img src={imageUrl} alt="" />
        ) : (
          initials
        )}
      </span>

      <div className="entry-main">
        <div className="entry-title">
          {sponsored && <span className="entry-badge entry-badge-sponsored">Sponsored</span>}
          {verified && (
            <span className="entry-badge entry-badge-verified">
              <BadgeCheck size={12} aria-hidden />
              Verified
            </span>
          )}
          {isNew && <span className="entry-badge entry-badge-new">New</span>}
          {title}
        </div>
        <div className="entry-meta">
          <span className="entry-sub">{subtitle}</span>
          {tags.map((t) => (
            <span className="chip" key={t}>
              {t}
            </span>
          ))}
          {reasonChips && <ReasonChips chips={reasonChips} />}
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
        <button className="btn btn-pink" onClick={() => setPopupOpen(true)}>
          View options
        </button>
      </div>

      {detailOpen && (
        <div className="entry-detail" id={detailId}>
          {detail.map((d) => (
            <div key={d.label}>
              <strong>{d.label}:</strong> {d.value}
            </div>
          ))}
          {consentNote && <p className="consent-note">{consentNote}</p>}
        </div>
      )}

      {popupOpen && (
        <ActionPopup
          clubToken={clubToken}
          club_id={club_id}
          entryId={entryId}
          entryTitle={title}
          options={actions}
          isFirstTokenEncounter={isFirstTokenEncounter}
          onClose={() => setPopupOpen(false)}
          reasonOptions={reasonOptions}
        />
      )}
    </div>
  );
}
