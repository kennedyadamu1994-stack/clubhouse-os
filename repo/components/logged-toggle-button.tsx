"use client";

import { useState, useTransition } from "react";
import { toggleActionLogged } from "@/lib/actions";
import type { ActionLogRow } from "@/lib/types";

interface LoggedToggleButtonProps {
  logId: string;
  status: ActionLogRow["status"];
}

/**
 * Per-request "mark as logged" toggle on the admin datalog. Flips a row's
 * status between pending and complete via toggleActionLogged() (lib/actions.ts
 * → setActionStatus()). Never touches token_cost, so this can't change a
 * club's balance — it's purely Kennedy's own tracking of what he's actioned.
 * Disabled while a cancelled row (not a state this button can produce or undo).
 *
 * toggleActionLogged now returns { ok, error } rather than the raw next
 * status (5 Sep security fix — it checks the real admin session itself
 * and needs a way to report "not signed in" back to this button without
 * throwing across the server-action boundary). On failure, localStatus
 * simply isn't updated — the button stays showing its current real state
 * rather than flipping to a status that was never actually written.
 */
export function LoggedToggleButton({ logId, status }: LoggedToggleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);

  if (localStatus === "cancelled") return null;

  function handleClick() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await toggleActionLogged(logId, localStatus);
      if (result.ok) {
        setLocalStatus(result.status);
      } else {
        setError(result.error);
      }
    });
  }

  const isLogged = localStatus === "complete";

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={isLogged ? "btn-black" : "btn-pink"}
        style={{
          border: isLogged ? "1px solid var(--line-strong)" : "none",
          borderRadius: "var(--radius)",
          padding: "6px 12px",
          fontSize: "0.8rem",
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Saving…" : isLogged ? "✓ Logged" : "Mark as logged"}
      </button>
      {error && <div style={{ color: "var(--danger)", fontSize: "0.72rem", marginTop: 4 }}>{error}</div>}
    </div>
  );
}
