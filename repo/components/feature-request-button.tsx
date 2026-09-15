"use client";

import { useState } from "react";
import { FeatureRequestForm } from "./feature-request-form";

/** Trigger for the Request a Feature modal — same open/close pattern as ContactButton. */
export function FeatureRequestButton({ clubToken, club_id }: { clubToken: string; club_id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn btn-pink" onClick={() => setOpen(true)}>
        Request a feature
      </button>
      {open && <FeatureRequestForm clubToken={clubToken} club_id={club_id} onClose={() => setOpen(false)} />}
    </>
  );
}
