"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavourite } from "@/lib/actions";
import { ActionPopup, type ActionOption } from "./action-popup";

/**
 * One row on the Favourites page (Kennedy's request, 9 Sep). Shows the
 * SNAPSHOT captured when this was saved — title/subtitle exactly as they
 * were at save time, not re-fetched live — so a favourite "still shows
 * plainly" even if the underlying listing was later removed from the
 * sheet, per Kennedy's explicit decision on that exact scenario.
 *
 * Clicking the row opens the real action popup (10 Sep follow-up: "when
 * the saved item is clicked... reveal the relevant pop up that shows the
 * action button options") rather than linking to the category page —
 * `actions` is built server-side in page.tsx via a fresh, live lookup of
 * the real item (resolveActionsFor), not from the saved snapshot, since
 * the snapshot only has title/subtitle/href, never the real action_key/
 * token_cost data needed to show accurate options.
 *
 * The remove button (heart icon) stays a separate control, not part of
 * the row's own click target, so removing a favourite never accidentally
 * opens the popup first.
 */
export function FavouriteRowItem({
  clubToken,
  club_id,
  category,
  item_id,
  title,
  subtitle,
  href,
  actions,
  isFirstTokenEncounter,
}: {
  clubToken: string;
  club_id: string;
  category: string;
  item_id: string;
  title: string;
  subtitle: string;
  href: string;
  actions: ActionOption[];
  isFirstTokenEncounter: boolean;
}) {
  const [removed, setRemoved] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setRemoved(true); // optimistic — this action only ever removes from here, never re-adds
    startTransition(async () => {
      await toggleFavourite(clubToken, club_id, category, item_id, title, subtitle, href);
    });
  }

  if (removed) return null;

  return (
    <>
      <button type="button" className="favourite-row" onClick={() => setPopupOpen(true)}>
        <span className="favourite-row-main">
          <span className="favourite-row-title">{title}</span>
          {subtitle && <span className="favourite-row-subtitle">{subtitle}</span>}
        </span>
        <span
          role="button"
          tabIndex={0}
          className="favourite-row-remove"
          onClick={handleRemove}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleRemove(e as unknown as React.MouseEvent);
            }
          }}
          aria-label={`Remove ${title} from favourites`}
          title="Remove from favourites"
        >
          <Heart size={16} fill="currentColor" aria-hidden />
        </span>
      </button>
      {popupOpen && (
        <ActionPopup
          clubToken={clubToken}
          club_id={club_id}
          entryId={item_id}
          entryTitle={title}
          options={actions}
          isFirstTokenEncounter={isFirstTokenEncounter}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </>
  );
}
