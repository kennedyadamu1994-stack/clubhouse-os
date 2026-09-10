"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toggleFavourite } from "@/lib/actions";

/**
 * One row on the Favourites page (Kennedy's request, 9 Sep). Shows the
 * SNAPSHOT captured when this was saved — title/subtitle exactly as they
 * were at save time, not re-fetched live — so a favourite "still shows
 * plainly" even if the underlying listing was later removed from the
 * sheet, per Kennedy's explicit decision on that exact scenario.
 *
 * The remove button calls the same toggleFavourite action every heart
 * icon uses elsewhere in the app — removing here and un-hearting a card
 * on its own Outreach page are the same real action, not two different
 * code paths that could drift out of sync.
 */
export function FavouriteRowItem({
  clubToken,
  club_id,
  category,
  item_id,
  title,
  subtitle,
  href,
}: {
  clubToken: string;
  club_id: string;
  category: string;
  item_id: string;
  title: string;
  subtitle: string;
  href: string;
}) {
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    setRemoved(true); // optimistic — this action only ever removes from here, never re-adds
    startTransition(async () => {
      await toggleFavourite(clubToken, club_id, category, item_id, title, subtitle, href);
    });
  }

  if (removed) return null;

  return (
    <div className="favourite-row">
      <Link href={href} className="favourite-row-main">
        <span className="favourite-row-title">{title}</span>
        {subtitle && <span className="favourite-row-subtitle">{subtitle}</span>}
      </Link>
      <button
        type="button"
        className="favourite-row-remove"
        onClick={handleRemove}
        disabled={isPending}
        aria-label={`Remove ${title} from favourites`}
        title="Remove from favourites"
      >
        <Heart size={16} fill="currentColor" aria-hidden />
      </button>
    </div>
  );
}
