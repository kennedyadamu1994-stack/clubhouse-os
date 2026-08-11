import type { Club, Sponsorship, Opportunity, Player, Recommendation } from "./types";

/** Weights come from Config data (decision D4) so Kennedy can tune them without a code change. */
export interface ScoreWeights {
  sport: number;
  area: number;
  tag: number;
  tagCap: number;
  urgency: number; // bonus when a closing date is within 30 days
}

const overlap = (a: string[], b: string[]) =>
  a.filter((t) => b.map((x) => x.toLowerCase().trim()).includes(t.toLowerCase().trim())).length;

/** Match score 0–100. Entries missing data score on what exists — never error. */
export function matchScore(
  club: Club,
  entry: {
    sports?: string[];
    areas?: string[];
    area?: string;
    tags?: string[];
    eligibility_tags?: string[];
    closing_date?: string;
  },
  w: ScoreWeights,
): number {
  let s = 0;
  const sports = entry.sports ?? [];
  const areas = entry.areas ?? (entry.area ? [entry.area] : []);
  const tags = entry.tags ?? entry.eligibility_tags ?? [];
  if (sports.length && overlap(sports, [club.sport]) > 0) s += w.sport;
  if (areas.length && overlap(areas, [club.area]) > 0) s += w.area;
  s += Math.min(overlap(tags, club.priorities) * w.tag, w.tagCap);
  if (entry.closing_date) {
    const days = (new Date(entry.closing_date).getTime() - Date.now()) / 86_400_000;
    if (days >= 0 && days <= 30) s += w.urgency;
  }
  return Math.min(Math.round(s), 100);
}

/** Interim metric until the triage tool (D10) exists. The UI labels this "Profile completeness" — never "health". */
export function profileCompleteness(club: Club): number {
  const checks = [
    club.name,
    club.sport,
    club.area,
    club.contact_email,
    club.goals,
    club.priorities.length > 0,
    club.kpis.length > 0,
    club.members_count !== null,
    club.teams_count !== null,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export type PeerComparison =
  | { comparable: true; position: number; totalPeers: number; peerAverage: number }
  | { comparable: false; totalPeers: number };

/**
 * Workspace → Insights' comparison table (docs/sections/03-05 § Insights): this
 * club's completeness score against clubs sharing the same sport AND area,
 * aggregate only. Distinct from architecture.md's "neighbourhood ranking"
 * (area-only, spec'd for Overview, not yet built there — see README) —
 * different scope, kept as a separate helper so the two aren't conflated.
 * Fewer than 5 peers is treated as too small a sample to show a position.
 */
export function peerComparison(ownScore: number, peerScores: number[]): PeerComparison {
  const totalPeers = peerScores.length;
  if (totalPeers < 5) return { comparable: false, totalPeers };
  const allScores = [...peerScores, ownScore].sort((a, b) => b - a);
  const position = allScores.indexOf(ownScore) + 1;
  const peerAverage = Math.round(peerScores.reduce((n, s) => n + s, 0) / totalPeers);
  return { comparable: true, position, totalPeers: totalPeers + 1, peerAverage };
}

export function topRecommendations(
  club: Club,
  sponsorships: Sponsorship[],
  opportunities: Opportunity[],
  players: Player[],
  w: ScoreWeights,
  limit = 5,
): Recommendation[] {
  if (club.priorities.length === 0) return []; // pre-priorities clubs get the empty state, not noise
  const recs: Recommendation[] = [
    ...sponsorships.map((sp) => ({
      kind: "sponsorship" as const,
      id: sp.opportunity_id,
      title: sp.title,
      subtitle: `${sp.amount} · closes ${new Date(sp.closing_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
      score: matchScore(club, sp, w),
    })),
    ...opportunities
      .filter((o) => o.status === "open")
      .map((o) => ({
        kind: "opportunity" as const,
        id: o.opportunity_id,
        title: o.title,
        subtitle: o.type,
        score: matchScore(club, o, w),
      })),
    ...players.map((p) => ({
      kind: "player" as const,
      id: p.player_id,
      title: p.name ?? `Player in ${p.area}`,
      subtitle: p.sports.join(", "),
      score: matchScore(club, { sports: p.sports, area: p.area, tags: p.interests }, w),
    })),
  ];
  return recs.sort((a, b) => b.score - a.score).slice(0, limit);
}
