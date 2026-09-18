/**
 * Displays a 1-5 star rating from a real credibility_score value (6 Sep
 * — Kennedy: "a universal star system... right now I want it to
 * represent the quality of the data or how good I think any piece of
 * data is... can be half stars as well"). Used across every Outreach
 * category that has this real column: Players, People, Brands,
 * Influencers, Clubs, Suppliers, Social Venues, Sponsorship.
 *
 * Renders nothing when score is null/undefined — an entry with no
 * credibility_score value set is just not rated yet, never shown as a
 * misleading 0 or 1-star rating (the same "absence isn't a low score"
 * principle already used for ReasonChips and MatchScoreBadge before it).
 *
 * Half-star support uses a real SVG clipPath to fill exactly the
 * correct fraction of each star — not a CSS trick or a separate
 * "half star" icon asset — built from the exact same path data as
 * lucide-react's own Star icon, so a filled star here looks pixel-
 * identical to every other Star icon already used in the app (e.g.
 * Club Health's "User Reviews" category).
 */
const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

interface StarRatingProps {
  score: number | null | undefined;
  /** Pixel size of each star. Defaults to 14, matching the app's small badge-scale icons. */
  size?: number;
}

export function StarRating({ score, size = 14 }: StarRatingProps) {
  if (score == null) return null;
  // Clamp to the real 1-5 scale Kennedy defined (1 poor, 5 excellent) —
  // defensive only, since a sheet typo (e.g. "50" instead of "5") should
  // never render a broken-looking row of 10 stars.
  const clamped = Math.max(0, Math.min(5, score));

  return (
    <span className="star-rating" role="img" aria-label={`${clamped} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        // How much of THIS star is filled: 1 = fully filled, 0.5 = half,
        // 0 = empty outline. Clamped per-star so e.g. a 3.5 score fills
        // stars 1-3 completely, star 4 exactly half, star 5 not at all.
        const fillFraction = Math.max(0, Math.min(1, clamped - i));
        const clipId = `star-clip-${i}-${Math.round(clamped * 10)}`;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--faint)"
            strokeWidth="1.5"
            aria-hidden
          >
            {/* Outline star, always drawn first as the base layer */}
            <path d={STAR_PATH} />
            {fillFraction > 0 && (
              <>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width={24 * fillFraction} height="24" />
                </clipPath>
                {/* Filled star, clipped to exactly the correct fraction of width */}
                <path d={STAR_PATH} fill="var(--pink)" stroke="var(--pink)" clipPath={`url(#${clipId})`} />
              </>
            )}
          </svg>
        );
      })}
      <span className="star-rating-value">{clamped % 1 === 0 ? clamped : clamped.toFixed(1)}</span>
    </span>
  );
}
