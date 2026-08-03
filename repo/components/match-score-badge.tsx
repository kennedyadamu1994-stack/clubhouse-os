import { matchScoreColour, matchScoreTextColour } from "@/lib/match-colour";

/** Match-score chip: 0% deep red -> 50% yellow -> 100% dark green (Kennedy's spec). Used on every Outreach entry card. */
export function MatchScoreBadge({ score }: { score: number }) {
  return (
    <span
      className="match-score-badge"
      style={{ background: matchScoreColour(score), color: matchScoreTextColour }}
      title="How closely this matches your club's sport, area, and priorities"
    >
      {score}% match
    </span>
  );
}
