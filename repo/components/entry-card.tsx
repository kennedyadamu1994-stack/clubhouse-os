"use client";

import { useState } from "react";
import { ActionPopup, type ActionOption } from "./action-popup";
import { MatchScoreBadge } from "./match-score-badge";

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
  matchScore?: number; // 0-100; omitted entirely for pre-priorities clubs rather than shown as 0
  detail: EntryDetailField[]; // GDPR-safe fields only — never raw name/email/phone
  consentNote?: string; // shown when identifying info is withheld
  actions: ActionOption[];
  isFirstTokenEncounter: boolean;
  defaultOpen?: boolean;
}

/**
 * Used across all six Outreach subsections (docs/components.md #1). The
 * header row (avatar + title + match score) is the single expand/collapse
 * control at every screen size — desktop included, per Kennedy's request.
 * Defaults open so first-load behaviour matches what people already expect;
 * collapsing is an option, not a surprise.
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
  matchScore,
  detail,
  consentNote,
  actions,
  isFirstTokenEncounter,
  defaultOpen = true,
}: EntryCardProps) {
  const [expanded, setExpanded] = useState(false); // the "i" detail panel, separate from the card's own open/closed state
  const [popupOpen, setPopupOpen] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const detailId = `detail-${entryId}`;
  const bodyId = `card-body-${entryId}`;

  return (
    <div className={`entry-card ${open ? "mobile-open" : ""}`}>
      <button
        className="entry-mobile-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <span className="entry-avatar" aria-hidden>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- per-entry external photo, not a static asset
            <img src={imageUrl} alt="" />
          ) : (
            initials
          )}
        </span>
        <span className="entry-mobile-title">{title}</span>
        {matchScore != null && <MatchScoreBadge score={matchScore} compact />}
        <span className="entry-mobile-chevron" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>

      <div className="entry-card-body" id={bodyId}>
        <div className="entry-body">
          <div className="entry-sub">{subtitle}</div>
          {tags.length > 0 && (
            <div className="entry-tags">
              {tags.map((t) => (
                <span className="chip" key={t}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="entry-actions">
          <button
            className="eye-btn"
            aria-expanded={expanded}
            aria-controls={detailId}
            aria-label={expanded ? "Hide details" : "Show details"}
            onClick={() => setExpanded((v) => !v)}
          >
            i
          </button>
          <button className="btn btn-pink" onClick={() => setPopupOpen(true)}>
            View options
          </button>
        </div>

        {expanded && (
          <div className="entry-detail" id={detailId}>
            {detail.map((d) => (
              <div key={d.label}>
                <strong>{d.label}:</strong> {d.value}
              </div>
            ))}
            {consentNote && <p className="consent-note">{consentNote}</p>}
          </div>
        )}
      </div>

      {popupOpen && (
        <ActionPopup
          clubToken={clubToken}
          club_id={club_id}
          entryId={entryId}
          entryTitle={title}
          options={actions}
          isFirstTokenEncounter={isFirstTokenEncounter}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </div>
  );
}
