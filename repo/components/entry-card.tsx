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
}

/** Used across all six Outreach subsections (docs/components.md #1). Collapses to a summary row on mobile — tap to expand the full card. */
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
}: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const detailId = `detail-${entryId}`;

  return (
    <div className={`entry-card ${mobileOpen ? "mobile-open" : ""}`} style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
      <button
        className="entry-mobile-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-controls={`card-body-${entryId}`}
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
        {matchScore != null && <MatchScoreBadge score={matchScore} />}
        <span className="entry-mobile-chevron" aria-hidden>
          {mobileOpen ? "−" : "+"}
        </span>
      </button>

      <div className="entry-card-body" id={`card-body-${entryId}`}>
        <div style={{ display: "flex", gap: 14, flex: 1, minWidth: 220 }}>
          <div className="entry-avatar entry-avatar-desktop" aria-hidden>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" />
            ) : (
              initials
            )}
          </div>
          <div className="entry-body">
            <div className="entry-title-row">
              <div className="entry-title">{title}</div>
              {matchScore != null && <MatchScoreBadge score={matchScore} />}
            </div>
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
          <div className="entry-detail" id={detailId} style={{ width: "100%" }}>
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
