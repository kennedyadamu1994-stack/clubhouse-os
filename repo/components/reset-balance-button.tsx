"use client";

import { useState, useTransition } from "react";
import { resetClubTokenBalance } from "@/lib/actions";

interface ResetBalanceButtonProps {
  clubId: string;
  clubName: string;
  balance: number;
  allocation: number;
}

/**
 * One button per club on the admin datalog: restores that club's token
 * balance to full allocation. Calls resetClubTokenBalance() (lib/actions.ts)
 * — appends a single "adjustment" ledger row, never edits/deletes existing
 * rows, so request history stays fully intact. Confirms before acting since
 * this changes a real balance, and is a no-op (button disabled) once the
 * club is already at full allocation.
 *
 * resetClubTokenBalance now returns { ok, error } rather than the raw
 * balance object (5 Sep security fix — it checks the real admin session
 * itself and needs a way to report "not signed in" back to this button
 * without throwing across the server-action boundary).
 */
export function ResetBalanceButton({ clubId, clubName, balance, allocation }: ResetBalanceButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alreadyFull = balance >= allocation;

  function handleClick() {
    if (alreadyFull || isPending) return;
    const confirmed = window.confirm(
      `Restore ${clubName}'s balance from ${balance} to ${allocation} tokens? Request history is kept.`,
    );
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await resetClubTokenBalance(clubId);
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={alreadyFull || isPending}
        className="btn-black"
        style={{
          border: "none",
          borderRadius: "var(--radius)",
          padding: "6px 12px",
          fontSize: "0.8rem",
          cursor: alreadyFull || isPending ? "default" : "pointer",
          opacity: alreadyFull || isPending ? 0.5 : 1,
        }}
      >
        {isPending ? "Resetting…" : alreadyFull ? "Already full" : done ? "Reset ✓" : "Reset balance"}
      </button>
      {error && <div style={{ color: "var(--danger)", fontSize: "0.75rem", marginTop: 4 }}>{error}</div>}
    </div>
  );
}
