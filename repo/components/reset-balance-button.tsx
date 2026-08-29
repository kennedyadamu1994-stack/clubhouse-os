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
 */
export function ResetBalanceButton({ clubId, clubName, balance, allocation }: ResetBalanceButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const alreadyFull = balance >= allocation;

  function handleClick() {
    if (alreadyFull || isPending) return;
    const confirmed = window.confirm(
      `Restore ${clubName}'s balance from ${balance} to ${allocation} tokens? Request history is kept.`,
    );
    if (!confirmed) return;
    startTransition(async () => {
      await resetClubTokenBalance(clubId);
      setDone(true);
    });
  }

  return (
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
  );
}
