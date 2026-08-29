"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitOutreachAction, getClubTokenStatus } from "@/lib/actions";
import { InsufficientTokensPopup } from "./insufficient-tokens-popup";
import type { PlanDetails, PlanTier } from "@/lib/types";

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
  /**
   * Optional "reason for reaching out" dropdown, shown above the notes
   * field (Kennedy's request, 20 Aug: Outreach → Clubs' popup should give a
   * prompt for what to ask, alongside everything already there — not
   * replacing it). Only passed by callers that want it (currently just
   * Outreach → Clubs); every other ActionPopup usage is unaffected. The
   * selected reason is prepended to the notes text sent with the request,
   * not a separate field on the ledger — keeps this additive rather than a
   * schema change.
   */
  reasonOptions?: string[];
}

/**
 * The single most-reused component in the platform (docs/components.md #2).
 * Desktop: centred modal, focus-trapped, Esc closes.
 * Mobile (<640px, via CSS): the SAME markup becomes a full-screen sheet —
 * that's a CSS decision (see .modal-overlay/.modal in globals.css), not a
 * different component, so every subsection gets it for free.
 *
 * Affordability check (28 Aug, Kennedy: "button visibly shows it's
 * unaffordable beforehand"): fetches the club's real-time balance via
 * getClubTokenStatus on mount rather than requiring every one of the ~10
 * pages that render this component (through EntryCard) to fetch and
 * thread balance down as a prop. Pink buttons costing more than the
 * fetched balance render greyed out and disabled; clicking one that
 * somehow still gets through (a stale fetch, a race) opens
 * InsufficientTokensPopup instead of attempting a submission the server
 * would reject anyway (see PostgresAdapter.submitAction's own hard-cap
 * enforcement, which is the actual source of truth this UI is mirroring,
 * not replacing).
 */
export function ActionPopup({
  clubToken,
  club_id,
  entryId,
  entryTitle,
  options,
  isFirstTokenEncounter,
  onClose,
  reasonOptions,
}: ActionPopupProps) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState(reasonOptions?.[0] ?? "");
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState("");
  const [status, setStatus] = useState<
    { state: "idle" } | { state: "submitting"; key: string } | { state: "done"; key: string; balance: number } | { state: "error"; message: string }
  >({ state: "idle" });
  const [tokenStatus, setTokenStatus] = useState<{
    balance: number;
    plans: PlanDetails[];
    currentTier: PlanTier;
  } | null>(null);
  const [insufficientFor, setInsufficientFor] = useState<ActionOption | null>(null);

  // Fetch the real balance once when the popup opens — see doc comment
  // above for why this is a client-side fetch rather than a prop.
  useEffect(() => {
    let cancelled = false;
    getClubTokenStatus(club_id).then(({ balance, plans, currentTier }) => {
      if (!cancelled && currentTier) setTokenStatus({ balance, plans, currentTier });
    });
    return () => {
      cancelled = true;
    };
  }, [club_id]);

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
    // Client-side affordability check (28 Aug) — mirrors, doesn't replace,
    // the real server-side hard cap in submitAction. If the fetch hasn't
    // resolved yet, fall through to the submission and let the server be
    // the source of truth rather than blocking on a slow network.
    if (tokenStatus && opt.token_cost > tokenStatus.balance) {
      setInsufficientFor(opt);
      return;
    }

    const idempotency_key = `${club_id}-${opt.action_key}-${entryId}-${Date.now()}`;
    setStatus({ state: "submitting", key: opt.action_key });
    const combinedNotes = reasonOptions ? [`Reason: ${reason}`, notes].filter(Boolean).join(" — ") : notes;
    try {
      const result = await submitOutreachAction({
        clubToken,
        club_id,
        action_key: opt.action_key,
        entry_id: entryId,
        notes: combinedNotes,
        idempotency_key,
      });
      if (!result.ok) {
        if (result.error_code === "insufficient_tokens") {
          // Server caught what the client-side check above missed (a
          // stale balance fetch, a race) — show the same popup rather
          // than a bare error message.
          setInsufficientFor(opt);
          setStatus({ state: "idle" });
          return;
        }
        setStatus({ state: "error", message: result.error ?? "Something went wrong — please try again." });
        return;
      }
      setStatus({ state: "done", key: opt.action_key, balance: result.new_balance });
      // Force the current page's server components to re-fetch fresh data
      // (28 Aug fix, second attempt) — revalidatePath on the server side
      // only marks the cache stale for the NEXT request; it doesn't push
      // updated data into a page that's already mounted in the browser.
      // Since this popup stays open on the same page after submitting,
      // nothing was telling the header's token widget (or anything else
      // already on screen) to actually pull the new balance until a full
      // navigation happened to trigger a fresh fetch. router.refresh()
      // re-renders the current route's server components with fresh data
      // without losing client state, so the popup itself stays open and
      // showing its own correct "Done" message while everything else on
      // the page catches up to match it.
      router.refresh();
    } catch {
      setStatus({
        state: "error",
        message: "We couldn't log this — nothing was deducted, try again.",
      });
    }
  }

  const submittingKey = status.state === "submitting" ? status.key : null;
  const isDone = status.state === "done";

  if (insufficientFor && tokenStatus) {
    return (
      <InsufficientTokensPopup
        clubToken={clubToken}
        club_id={club_id}
        currentTier={tokenStatus.currentTier}
        plans={tokenStatus.plans}
        shortfall={{ needed: insufficientFor.token_cost, balance: tokenStatus.balance }}
        onClose={onClose}
      />
    );
  }

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
            <strong>Done.</strong> We&apos;ve logged this and notified The NBRH. Your token balance
            has been updated.
          </div>
        ) : (
          <>
            <div className="action-row">
              {options.map((opt) => {
                if (opt.colour === "black") {
                  return (
                    <a
                      key={opt.action_key}
                      href={opt.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-black"
                    >
                      {opt.label}
                    </a>
                  );
                }
                // Unaffordable state (28 Aug, Kennedy: "button visibly
                // shows it's unaffordable beforehand") — only known once
                // tokenStatus has loaded; before that, buttons render
                // normally rather than assuming affordable or not.
                const isUnaffordable = tokenStatus != null && opt.token_cost > tokenStatus.balance;
                return (
                  <button
                    key={opt.action_key}
                    className={`btn btn-pink${isUnaffordable ? " btn-unaffordable" : ""}`}
                    onClick={() => (isUnaffordable ? setInsufficientFor(opt) : handlePinkAction(opt))}
                    disabled={submittingKey === opt.action_key}
                    aria-disabled={isUnaffordable}
                    title={isUnaffordable ? `You need ${opt.token_cost} tokens for this — you have ${tokenStatus.balance} left` : undefined}
                  >
                    {opt.token_cost === 0
                      ? opt.label
                      : `${opt.label} · ${opt.token_cost} token${opt.token_cost === 1 ? "" : "s"}${isUnaffordable ? " (not enough)" : ""}`}
                  </button>
                );
              })}
            </div>

            {status.state === "error" && (
              <p style={{ color: "var(--danger)", fontSize: "0.82rem", marginTop: 10 }} role="alert">
                {status.message}
              </p>
            )}

            {reasonOptions && (
              <div className="field" style={{ marginTop: 18 }}>
                <label htmlFor={`${titleId}-reason`}>What&apos;s this about?</label>
                <select
                  id={`${titleId}-reason`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {reasonOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
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
