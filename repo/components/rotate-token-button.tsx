"use client";

import { useState, useTransition } from "react";
import { rotateClubToken } from "@/lib/actions";

interface RotateTokenButtonProps {
  clubId: string;
  clubName: string;
  currentToken: string;
}

/**
 * Admin-only: generates a brand-new random token for one club and writes
 * it to the real sheet (5 Sep security fix — see rotateClubToken's own
 * doc comment in lib/actions.ts). Shows the new token plainly after a
 * successful rotation so Kennedy can copy it and send the club their new
 * link himself — this component never sends anything anywhere on its
 * own, and never logs the token to the console or anywhere else, since
 * a freshly-generated credential should exist in exactly as few places
 * as possible until Kennedy has actually delivered it.
 *
 * Confirms before acting, since the club's OLD link stops working the
 * moment this succeeds — worth a deliberate pause given real clubs are
 * live on this.
 */
export function RotateTokenButton({ clubId, clubName, currentToken }: RotateTokenButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [newToken, setNewToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (isPending) return;
    const confirmed = window.confirm(
      `Generate a new token for ${clubName}? Their current dashboard link will stop working immediately — you'll need to send them the new one.`,
    );
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await rotateClubToken(clubId, clubName);
      if (result.ok) {
        setNewToken(result.newToken);
      } else {
        setError(result.error);
      }
    });
  }

  if (newToken) {
    return (
      <div style={{ fontSize: "0.8rem" }}>
        <div style={{ color: "var(--success)", fontWeight: 600, marginBottom: 4 }}>New token generated</div>
        <code
          style={{
            display: "block",
            background: "var(--surface-2)",
            padding: "6px 8px",
            borderRadius: "var(--radius)",
            wordBreak: "break-all",
            marginBottom: 4,
          }}
        >
          {newToken}
        </code>
        <div style={{ color: "var(--faint-text)" }}>Send this club their new dashboard link now.</div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn-black"
        style={{
          border: "none",
          borderRadius: "var(--radius)",
          padding: "6px 12px",
          fontSize: "0.8rem",
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.5 : 1,
        }}
      >
        {isPending ? "Generating…" : "Rotate token"}
      </button>
      {error && <div style={{ color: "var(--danger)", fontSize: "0.75rem", marginTop: 4 }}>{error}</div>}
    </div>
  );
}
