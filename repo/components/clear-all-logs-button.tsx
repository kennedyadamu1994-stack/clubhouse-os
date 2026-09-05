"use client";

import { useState, useTransition } from "react";
import { clearAllRequestLogs } from "@/lib/actions";

const CONFIRM_WORD = "DELETE";

/**
 * Admin-only "clear all data logs" button. Irreversible, and — since every
 * club's balance is computed from the ledger — wipes every club's spend
 * history back to full allocation as an unavoidable side effect. Guarded by
 * a real type-to-confirm prompt (not a plain window.confirm) because a
 * single misclick here can't be undone the way a single reset-balance click
 * can.
 */
export function ClearAllLogsButton() {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (confirmText !== CONFIRM_WORD || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await clearAllRequestLogs();
      if (result.ok) {
        setDone(true);
        setShowConfirm(false);
        setConfirmText("");
      } else {
        setError(result.error);
      }
    });
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="btn-black"
        style={{
          border: "1px solid var(--pink-line)",
          color: "var(--pink)",
          borderRadius: "var(--radius)",
          padding: "8px 14px",
          fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        {done ? "Cleared ✓, clear again?" : "Clear all data logs"}
      </button>
    );
  }

  return (
    <div
      className="card"
      style={{ borderColor: "var(--pink-line)", display: "flex", flexDirection: "column", gap: 10 }}
    >
      <p style={{ margin: 0, fontSize: "0.9rem" }}>
        This permanently deletes every request in the datalog, across every club, and resets
        every club&rsquo;s token balance back to full allocation. This cannot be undone.
      </p>
      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--dim)" }}>
        Type <strong style={{ color: "var(--text)" }}>{CONFIRM_WORD}</strong> to confirm.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={CONFIRM_WORD}
          style={{
            background: "var(--sunken)",
            border: "1px solid var(--line-strong)",
            borderRadius: "var(--radius)",
            padding: "6px 10px",
            color: "var(--text)",
            fontSize: "0.85rem",
          }}
        />
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirmText !== CONFIRM_WORD || isPending}
          className="btn-pink"
          style={{
            border: "none",
            borderRadius: "var(--radius)",
            padding: "6px 14px",
            fontSize: "0.85rem",
            cursor: confirmText !== CONFIRM_WORD || isPending ? "default" : "pointer",
            opacity: confirmText !== CONFIRM_WORD || isPending ? 0.5 : 1,
          }}
        >
          {isPending ? "Clearing…" : "Permanently clear everything"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowConfirm(false);
            setConfirmText("");
          }}
          className="btn-black"
          style={{
            border: "1px solid var(--line-strong)",
            borderRadius: "var(--radius)",
            padding: "6px 14px",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
      {error && <p style={{ margin: 0, color: "var(--danger)", fontSize: "0.85rem" }}>{error}</p>}
    </div>
  );
}
