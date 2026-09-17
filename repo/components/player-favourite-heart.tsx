"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { togglePlayerFavouriteAction } from "@/lib/players/actions";
import { usePlayerSession } from "./player-session";

/**
 * Player-side equivalent of FavouriteHeart (components/favourite-heart.tsx)
 * — same optimistic-toggle interaction and visual treatment, but keyed
 * by the logged-in player's email (usePlayerSession) rather than
 * clubToken/club_id. A separate component, not clubToken/club_id made
 * optional on the original — favourite-heart.tsx's whole contract
 * assumes a club identity is always present; forcing an email path
 * through the same component would mean conditionals on every prop
 * rather than one clean, dedicated version.
 *
 * Reads its own initial saved state from usePlayerSession's shared
 * favouritedKeys set (15 Sep) rather than an initiallySaved prop — this
 * card renders inside NbrhEngine's own cardRenderer function prop
 * (components/nbrh-engine.tsx), which calls a plain function per item
 * with no way to thread an async-fetched Set through that boundary
 * cleanly; reading from context sidesteps that entirely. Calls
 * refreshFavourites() after a successful toggle so every other card
 * showing the same item elsewhere on the page updates too, not just
 * this one's own local state.
 *
 * Renders nothing (not even a disabled heart) when no one is logged in
 * — clicking a heart with no session to save against isn't a
 * meaningful action, unlike FavouriteHeart's original context where a
 * clubToken is always guaranteed by the route itself.
 */
export function PlayerFavouriteHeart({
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
  const { email, favouritedKeys, refreshFavourites } = usePlayerSession();
  const initiallySaved = favouritedKeys.has(`${category}:${item_id}`);
  const [saved, setSaved] = useState(initiallySaved);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Keeps this card's own local state in sync if the shared set changes
  // for a reason other than this exact button (e.g. toggled elsewhere
  // on the same page, or refreshed after login).
  if (saved !== initiallySaved && !isPending) {
    setSaved(initiallySaved);
  }

  if (!email) return null;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next); // optimistic
    setError(null);
    startTransition(async () => {
      const result = await togglePlayerFavouriteAction(email!, category, item_id, title, subtitle, href);
      if (result.error) {
        setSaved(!next); // revert — the save genuinely didn't happen (e.g. 50-item cap)
        setError(result.error);
      } else {
        setSaved(result.saved);
        await refreshFavourites();
      }
    });
  }

  return (
    <span className="favourite-heart-wrap">
      <button
        type="button"
        className={`favourite-heart-btn${saved ? " favourite-heart-btn-saved" : ""}`}
        onClick={handleClick}
        disabled={isPending}
        aria-label={saved ? `Remove ${title} from favourites` : `Save ${title} to favourites`}
        aria-pressed={saved}
        title={saved ? "Saved to favourites" : "Save to favourites"}
      >
        <Heart size={16} fill={saved ? "currentColor" : "none"} aria-hidden />
      </button>
      {error && <span className="favourite-heart-error">{error}</span>}
    </span>
  );
}
