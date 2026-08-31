import { matchScoreColour, matchScoreTextColour } from "@/lib/match-colour";

/**
 * Match-score badge: 0% deep red -> 50% yellow -> 100% dark green.
 * Two shapes:
 *   - default: a pill reading "72% match" (Overview recommendations, where
 *     there's room and the extra words add clarity)
 *   - compact: a small square showing just "72" (entry-card header rows,
 *     where space is tight — Kennedy's request for something more compact
 *     and square-shaped)
 */
export function MatchScoreBadge({ score, compact = false }: { score: number; compact?: boolean }) {
  const style = { background: matchScoreColour(score), color: matchScoreTextColour };
  const title = "How closely this matches your club's tags";

  if (compact) {
    return (
      <span className="match-score-square" style={style} title={`${score}% match — ${title}`}>
        {score}
      </span>
    );
  }
  return (
    <span className="match-score-badge" style={style} title={title}>
      {score}% match
    </span>
  );
}
