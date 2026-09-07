"use client";

import { useState } from "react";
import { ActionPopup, type ActionOption } from "./action-popup";
import type { Recommendation } from "@/lib/types";

/**
 * Real action button per Top Recommendations entry (Kennedy's request, 25
 * Aug — was previously just a static badge with no way to act on it).
 * Reuses ActionPopup directly rather than building a second popup system;
 * options are built from the recommendation's own action_key/token_cost,
 * which were deliberately kept in sync with what the same entry's real
 * Outreach page shows (see lib/scoring.ts's topRecommendations).
 */
export function RecommendationActionButton({
  rec,
  clubToken,
  club_id,
  isFirstTokenEncounter,
}: {
  rec: Recommendation;
  clubToken: string;
  club_id: string;
  isFirstTokenEncounter: boolean;
}) {
  const [open, setOpen] = useState(false);

  const options: ActionOption[] = [
    ...(rec.view_url
      ? [{ action_key: "view_opportunity", label: "See the full listing", colour: "black" as const, token_cost: 0, href: rec.view_url }]
      : []),
    { action_key: rec.action_key, label: rec.action_label, colour: "pink" as const, token_cost: rec.token_cost },
  ];

  return (
    <>
      <button type="button" className="btn btn-pink rec-action-btn" onClick={() => setOpen(true)}>
        {rec.action_label}
      </button>
      {open && (
        <ActionPopup
          clubToken={clubToken}
          club_id={club_id}
          entryId={rec.id}
          entryTitle={rec.title}
          options={options}
          isFirstTokenEncounter={isFirstTokenEncounter}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
