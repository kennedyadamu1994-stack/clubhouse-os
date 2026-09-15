"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavourite } from "@/lib/actions";

/**
 * Heart icon for saving/unsaving an item to a club's Favourites page
 * (Kennedy's request, 9 Sep: "all elements in the NBRH that can be
 * interactive with... have a heart that can be clicked"). Used on every
 * Outreach category's EntryCard and on Trending Topics' own cards — the
 * only two places in the app with "elements a club interacts with", per
 * Kennedy's own framing of the request.
 *
 * initiallySaved comes from the page's own server-side lookup
 * (getFavouritedKeys — one query per page load, not one per card) so
 * the heart renders correctly filled/outline on first paint, matching
 * Kennedy's explicit requirement that saved state show "everywhere it
 * appears", not just where it was originally favourited from. Local
 * state after that first render is optimistic — flips immediately on
 * click rather than waiting on the server round trip, then reverts if
 * the save genuinely failed (e.g. the 50-item cap).
 *
 * category/item_id together are the real identity key (matching
 * whatever entryId each category's own EntryCard/TrendingBoard already
 * uses) — title/subtitle/href are the display snapshot captured at
 * save time, only sent on the ADD path (the server ignores them when
 * removing, per toggleFavourite's own contract).
 */
export function FavouriteHeart({
  clubToken,
  club_id,
  category,
  item_id,
  title,
  subtitle,
  href,
  initiallySaved,
}: {
  clubToken: string;
  club_id: string;
  category: string;
  item_id: string;
  title: string;
  subtitle: string;
  href: string;
  initiallySaved: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next); // optimistic
    setError(null);
    startTransition(async () => {
      const result = await toggleFavourite(clubToken, club_id, category, item_id, title, subtitle, href);
      if (result.error) {
        setSaved(!next); // revert — the save genuinely didn't happen (e.g. 50-item cap)
        setError(result.error);
      } else {
        setSaved(result.saved);
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
