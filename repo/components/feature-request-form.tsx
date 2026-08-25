"use client";

import { useEffect, useId, useRef, useState } from "react";
import { submitFreeAction } from "@/lib/actions";

/**
 * Request a Feature — Kennedy's request: "similar to the contact us box."
 * Deliberately its own form/modal rather than just relying on Contact Us's
 * existing "Request a change" dropdown option — that option exists, but a
 * separate, clearly-labelled box makes feature requests easy to find and
 * gives them their own action_key (feature_request, already registered at
 * 0 tokens in data/tokens_reference.json) so they show up distinctly in
 * Kennedy's ledger rather than blended into general contact messages.
 * Structurally identical to ContactUsForm (same modal base, focus trap,
 * submit flow) since there's no reason for the interaction pattern to
 * differ just because the topic does.
 */
export function FeatureRequestForm({
  clubToken,
  club_id,
  onClose,
}: {
  clubToken: string;
  club_id: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    { state: "idle" } | { state: "submitting" } | { state: "done" } | { state: "error"; message: string }
  >({ state: "idle" });

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

  async function handleSubmit() {
    if (!message.trim()) {
      setStatus({ state: "error", message: "Describe the feature before sending." });
      return;
    }
    setStatus({ state: "submitting" });
    try {
      const result = await submitFreeAction({
        clubToken,
        club_id,
        action_key: "feature_request",
        notes: message,
        idempotency_key: `feature-${club_id}-${Date.now()}`,
      });
      if (!result.ok) {
        setStatus({ state: "error", message: result.error ?? "Something went wrong — please try again." });
        return;
      }
      setStatus({ state: "done" });
    } catch {
      setStatus({ state: "error", message: "We couldn't send this — try again." });
    }
  }

  const isDone = status.state === "done";
  const isSubmitting = status.state === "submitting";

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef} tabIndex={-1}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 id={titleId}>Request a feature</h2>
        <p className="modal-sub">Always free — this never costs a token.</p>

        {isDone ? (
          <div className="token-explainer" role="status">
            <strong>Sent.</strong> We&apos;ve logged this and notified The NBRH — we&apos;ll get
            back to you.
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor={`${titleId}-message`}>What would you like to see?</label>
              <textarea
                id={`${titleId}-message`}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the feature and what it would help you do…"
              />
            </div>

            {status.state === "error" && (
              <p style={{ color: "var(--pink)", fontSize: "0.82rem", marginBottom: 12 }} role="alert">
                {status.message}
              </p>
            )}

            <button className="btn btn-pink" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send us your idea"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
