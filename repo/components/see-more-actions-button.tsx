"use client";

import { useState } from "react";
import type { ActionLogRow } from "@/lib/types";
import { AllActionsPopup } from "./all-actions-popup";

/**
 * Thin client wrapper around AllActionsPopup, just to hold the open/close
 * state — Overview's page.tsx itself is a server component and can't use
 * useState directly. Only rendered when there are more than 5 actions to
 * begin with (see page.tsx), so this button never appears for a club with
 * a short history.
 */
export function SeeMoreActionsButton({ actions }: { actions: ActionLogRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-black"
        style={{ marginTop: 12, fontSize: "0.82rem", padding: "8px 16px" }}
      >
        See all {actions.length} actions
      </button>
      {open && <AllActionsPopup actions={actions} onClose={() => setOpen(false)} />}
    </>
  );
}
