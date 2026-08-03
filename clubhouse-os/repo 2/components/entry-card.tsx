"use client";

import { useState } from "react";
import { ActionPopup, type ActionOption } from "./action-popup";

export interface EntryDetailField {
  label: string;
  value: string;
}

interface EntryCardProps {
  clubToken: string;
  club_id: string;
  entryId: string;
  initials: string; // avatar letters
  title: string; // name (if consented) or a safe fallback like "Coach in Hackney"
  subtitle: string;
  tags: string[];
  detail: EntryDetailField[]; // GDPR-safe fields only — never raw name/email/phone
  consentNote?: string; // shown when identifying info is withheld
  actions: ActionOption[];
  isFirstTokenEncounter: boolean;
}

/** Used across all six Outreach subsections (docs/components.md #1). */
export function EntryCard({
  clubToken,
  club_id,
  entryId,
  initials,
  title,
  subtitle,
  tags,
  detail,
  consentNote,
  actions,
  isFirstTokenEncounter,
}: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const detailId = `detail-${entryId}`;

  return (
    <div className="entry-card" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ display: "flex", gap: 14, flex: 1, minWidth: 220 }}>
        <div className="entry-avatar" aria-hidden>
          {initials}
        </div>
        <div className="entry-body">
          <div className="entry-title">{title}</div>
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
          👁
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
