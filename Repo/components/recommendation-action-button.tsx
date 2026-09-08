"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { ActionPopup, type ActionOption } from "./action-popup";
import type { Recommendation } from "@/lib/types";

/**
 * Real action button per Top Recommendations entry (Kennedy's request, 25
 * Aug — was previously just a static badge with no way to act on it).
 * Reuses ActionPopup directly rather than building a second popup system;
 * options are built from the recommendation's own action_key/token_cost,
 * which were deliberately kept in sync with what the same entry's real
 * Outreach page shows (see lib/scoring.ts's topRecommendations).
 *
 * Rendered as a compact, fixed-size pink arrow button (8 Sep — Kennedy:
 * "the white arrow in the pink box design... found in the search box
 * results"), not a text-label button — reuses askbar-icon-btn-pink
 * verbatim rather than a new style, the same real fix already proven for
 * the identical underlying problem: a recommendation's action_label can
 * now embed raw, unbounded sheet text (a funding amount description, not
 * just a short number), and a button sized to its own text has no good
 * behaviour once that text is genuinely long. The full label still
 * reaches the user, as the popup's own title/heading once it opens, and
 * as this button's aria-label/title for anyone using a screen reader or
 * hovering — it's just never rendered as visible button text itself.
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
      <button
        type="button"
        className="askbar-icon-btn askbar-icon-btn-pink"
        aria-label={rec.action_label}
        title={rec.action_label}
        onClick={() => setOpen(true)}
      >
        <ArrowUpRight size={15} aria-hidden />
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
