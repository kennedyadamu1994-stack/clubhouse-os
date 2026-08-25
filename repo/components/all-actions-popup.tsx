"use client";

import { useEffect, useId, useRef } from "react";
import type { ActionLogRow } from "@/lib/types";

interface AllActionsPopupProps {
  actions: ActionLogRow[];
  onClose: () => void;
}

/**
 * "See more" popup for Overview's Your Actions box (Kennedy's request, 20
 * Aug) — shows the FULL logged-actions list. The box itself still shows
 * only the 5 most recent (unchanged); this is purely an escape hatch for
 * everything beyond that. Read-only, no ActionPopup submission form reused
 * here since there's nothing to submit — same .modal-overlay/.modal shell
 * as every other popup in the app, just simpler contents.
 */
export function AllActionsPopup({ actions, onClose }: AllActionsPopupProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 id={titleId}>All actions</h2>
        <p className="modal-sub">
          {actions.length} logged action{actions.length === 1 ? "" : "s"} in total.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {actions.map((a) => (
            <div className="log-row" key={a.log_id}>
              <div>
                <div>{a.notes || a.action_key.replaceAll("_", " ")}</div>
                <div className="log-meta">
                  {new Date(a.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                  {" · "}
                  {a.token_cost} token{a.token_cost === 1 ? "" : "s"}
                </div>
              </div>
              <span className={`status ${a.status}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
