"use client";

import { useEffect, useId, useRef, useState } from "react";
import { submitOutreachAction } from "@/lib/actions";

export interface ActionOption {
  action_key: string;
  label: string; // e.g. "Send invite" — button text
  colour: "black" | "pink"; // black = self-serve external link, pink = Kennedy acts (costs tokens)
  token_cost: number; // 0 for black buttons
  href?: string; // required for black buttons
}

interface ActionPopupProps {
  clubToken: string;
  club_id: string;
  entryId: string;
  entryTitle: string;
  options: ActionOption[];
  isFirstTokenEncounter: boolean; // shows the one-off token explainer (Section 5 of the spec)
  onClose: () => void;
}

/**
 * The single most-reused component in the platform (docs/components.md #2).
 * Desktop: centred modal, focus-trapped, Esc closes.
 * Mobile (<640px, via CSS): the SAME markup becomes a full-screen sheet —
 * that's a CSS decision (see .modal-overlay/.modal in globals.css), not a
 * different component, so every subsection gets it for free.
 */
export function ActionPopup({
  clubToken,
  club_id,
  entryId,
  entryTitle,
  options,
  isFirstTokenEncounter,
  onClose,
}: ActionPopupProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState("");
  const [status, setStatus] = useState<
    { state: "idle" } | { state: "submitting"; key: string } | { state: "done"; key: string; balance: number } | { state: "error"; message: string }
  >({ state: "idle" });

  // Keyboard: Esc closes, focus trapped inside the dialog.
  useEffect(() => {
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handlePinkAction(opt: ActionOption) {
    const idempotency_key = `${club_id}-${opt.action_key}-${entryId}-${Date.now()}`;
    setStatus({ state: "submitting", key: opt.action_key });
    try {
      const result = await submitOutreachAction({
        clubToken,
        club_id,
        action_key: opt.action_key,
        entry_id: entryId,
        notes,
        idempotency_key,
      });
      if (!result.ok) {
        setStatus({ state: "error", message: result.error ?? "Something went wrong — please try again." });
        return;
      }
      setStatus({ state: "done", key: opt.action_key, balance: result.new_balance });
    } catch {
      setStatus({
        state: "error",
        message: "We couldn't log this — nothing was deducted, try again.",
      });
    }
  }

  const submittingKey = status.state === "submitting" ? status.key : null;
  const isDone = status.state === "done";

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef} tabIndex={-1}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 id={titleId}>{entryTitle}</h2>
        <p className="modal-sub">Choose how you&apos;d like to proceed.</p>

        {isFirstTokenEncounter && options.some((o) => o.colour === "pink") && (
          <div className="token-explainer">
            <strong>What&apos;s a token?</strong> 1 token ≈ 1 hour of The NBRH&apos;s time. Pink
            buttons cost tokens because Kennedy does the work for you; black buttons are free
            because you do it yourself. Your balance is always shown top-right.
          </div>
        )}

        {isDone ? (
          <div className="token-explainer" role="status">
            <strong>Done.</strong> We&apos;ve logged this and notified The NBRH. Your new balance
            is {status.balance} tokens.
          </div>
        ) : (
          <>
            <div className="action-row">
              {options.map((opt) =>
                opt.colour === "black" ? (
                  <a
                    key={opt.action_key}
                    href={opt.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-black"
                  >
                    {opt.label}
                  </a>
                ) : (
                  <button
                    key={opt.action_key}
                    className="btn btn-pink"
                    onClick={() => handlePinkAction(opt)}
                    disabled={submittingKey === opt.action_key}
                  >
                    {opt.label} · {opt.token_cost} token{opt.token_cost === 1 ? "" : "s"}
                  </button>
                ),
              )}
            </div>

            {status.state === "error" && (
              <p style={{ color: "var(--pink)", fontSize: "0.82rem", marginTop: 10 }} role="alert">
                {status.message}
              </p>
            )}

            <div className="field" style={{ marginTop: 18 }}>
              <label htmlFor={`${titleId}-notes`}>Notes for The NBRH (optional)</label>
              <textarea
                id={`${titleId}-notes`}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any context that will help us action this…"
              />
            </div>
          </>
        )}

        <div className="report-issue">
          {showReport ? (
            <div className="field">
              <label htmlFor={`${titleId}-report`}>What went wrong?</label>
              <textarea
                id={`${titleId}-report`}
                rows={2}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
              />
              <button
                className="btn btn-ghost"
                style={{ marginTop: 8 }}
                onClick={async () => {
                  await submitOutreachAction({
                    clubToken,
                    club_id,
                    action_key: "contact_us",
                    entry_id: entryId,
                    notes: `Issue report on "${entryTitle}": ${reportText}`,
                    idempotency_key: `report-${club_id}-${entryId}-${Date.now()}`,
                  });
                  setShowReport(false);
                  setReportText("");
                }}
              >
                Send report
              </button>
            </div>
          ) : (
            <button onClick={() => setShowReport(true)}>Report an issue with this action</button>
          )}
        </div>
      </div>
    </div>
  );
}
