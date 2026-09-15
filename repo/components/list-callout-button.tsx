"use client";

import { useState } from "react";
import { ActionPopup } from "./action-popup";

/**
 * "List a call-out" — a club-initiated action, not tied to any specific
 * entry. Originally lived on Workspace → Opportunities; moved to Tools →
 * Contact Us when that whole subsection was removed (Kennedy's request,
 * 9 Sep). Every other Action Pop-up in the platform is opened from an
 * EntryCard tied to a specific row; this one isn't about any existing
 * entry, so it gets its own minimal trigger button instead of a fake
 * EntryCard wrapping it.
 */
export function ListCalloutButton({
  clubToken,
  club_id,
  isFirstTokenEncounter,
}: {
  clubToken: string;
  club_id: string;
  isFirstTokenEncounter: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn btn-pink" onClick={() => setOpen(true)}>
        List a call-out · 1 token
      </button>
      {open && (
        <ActionPopup
          clubToken={clubToken}
          club_id={club_id}
          entryId="callout"
          entryTitle="List a call-out"
          options={[{ action_key: "list_callout", label: "Post it to the neighbourhood", colour: "pink", token_cost: 1 }]}
          reasonOptions={["List a role", "List a session", "List an event"]}
          isFirstTokenEncounter={isFirstTokenEncounter}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
