"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { togglePlayerFavouriteAction } from "@/lib/players/actions";
import { usePlayerSession } from "./player-session";

/**
 * Player-side equivalent of FavouriteRowItem (components/
 * favourite-row-item.tsx) — same snapshot-at-save-time display
 * (title/subtitle exactly as captured when favourited, never re-fetched
 * live) and same "remove heart is its own control, not the row's whole
 * click target" pattern. Genuinely simpler than the CHOS version: no
 * ActionPopup, no resolveActionsFor — a player's favourite has no
 * token-spend "actions" to rebuild, so the row just links straight out
 * to href, the same direct-link behaviour PlayerEntryCard's own "View"
 * button already uses everywhere else in POS.
 */
export function PlayerFavouriteRowItem({
  category,
  item_id,
  title,
  subtitle,
  href,
}: {
  category: string;
  item_id: string;
  title: string;
  subtitle: string;
  href: string;
}) {
  const { email, refreshFavourites } = usePlayerSession();
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!email) return;
    setRemoved(true); // optimistic
    startTransition(async () => {
      await togglePlayerFavouriteAction(email, category, item_id, title, subtitle, href);
      await refreshFavourites();
    });
  }

  if (removed) return null;

  return (
    <a
      className="favourite-row"
      href={href || undefined}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        if (!href) e.preventDefault();
      }}
    >
      <div className="favourite-row-main">
        <div className="favourite-row-title">{title}</div>
        {subtitle && <div className="favourite-row-subtitle">{subtitle}</div>}
      </div>
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
    </a>
  );
}
