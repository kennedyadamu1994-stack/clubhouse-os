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
 */
export function LoggedToggleButton({ logId, status }: LoggedToggleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(status);

  if (localStatus === "cancelled") return null;

  function handleClick() {
    if (isPending) return;
    startTransition(async () => {
      const next = await toggleActionLogged(logId, localStatus);
      setLocalStatus(next as ActionLogRow["status"]);
    });
  }

  const isLogged = localStatus === "complete";

  return (
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
  );
}
