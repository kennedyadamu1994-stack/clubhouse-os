"use client";

import { useEffect, useId, useRef, useState } from "react";
import { submitFreeAction } from "@/lib/actions";

const TYPES = [
  { value: "change_request", label: "Request a change" },
  { value: "suggestion", label: "Make a suggestion" },
  { value: "bug", label: "Report a bug" },
  { value: "help", label: "Ask for help" },
  { value: "rating", label: "Rate the platform" },
] as const;

/**
 * Contact Us (docs/sections 03-05 § Tools: "Action Pop-up variant, free,
 * types: change request / suggestion / bug / help / rating. Logs +
 * notifies like any pink action but costs 0."). Built as its own small
 * modal rather than a variant of ActionPopup — ActionPopup's UI is a row
 * of black/pink option buttons (docs/components.md #2), which doesn't fit
 * a form whose job is picking ONE type from a list and writing a message.
 * Reuses the same visual language (.modal-overlay/.modal, the same
 * focus-trap and Esc-to-close behaviour) and the same ledger pipeline
 * (submitFreeAction → contact_us, already registered in
 * data/tokens_reference.json at 0 tokens) so it's consistent with every
 * other action in the platform even though its form shape is different.
 */
export function ContactUsForm({
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
  const [type, setType] = useState<string>(TYPES[0].value);
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
      setStatus({ state: "error", message: "Add a short message before sending." });
      return;
    }
    setStatus({ state: "submitting" });
    const typeLabel = TYPES.find((t) => t.value === type)?.label ?? type;
    try {
      const result = await submitFreeAction({
        clubToken,
        club_id,
        action_key: "contact_us",
        notes: `[${typeLabel}] ${message}`,
        idempotency_key: `contact-${club_id}-${Date.now()}`,
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
        <h2 id={titleId}>Contact us</h2>
        <p className="modal-sub">Always free — this never costs a token.</p>

        {isDone ? (
          <div className="token-explainer" role="status">
            <strong>Sent.</strong> We&apos;ve logged this and notified The NBRH — we&apos;ll get
            back to you.
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor={`${titleId}-type`}>What&apos;s this about?</label>
              <select id={`${titleId}-type`} value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor={`${titleId}-message`}>Your message</label>
              <textarea
                id={`${titleId}-message`}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's going on…"
              />
            </div>

            {status.state === "error" && (
              <p style={{ color: "var(--pink)", fontSize: "0.82rem", marginBottom: 12 }} role="alert">
                {status.message}
              </p>
            )}

            <button className="btn btn-pink" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
