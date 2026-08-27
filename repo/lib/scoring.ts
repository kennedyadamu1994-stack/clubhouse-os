import type { Club, ClubDirectoryEntry, Sponsorship, Opportunity, Player, Recommendation } from "./types";

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

/** True if any value in a loosely matches any value in b, case/whitespace-insensitive. Used by the two match-score-card scorers below — a single shared "does this row have anything in common with that row" primitive, since every field on both cards (Kennedy's PDFs, 27 Aug) is scored the same simple way: full points if there's any overlap at all, zero otherwise. */
const anyOverlap = (a: string[], b: string[]) => overlap(a, b) > 0;

/**
 * A club's own activity_type/location/audience — the same three real
 * columns ClubDirectoryEntry already reads for every OTHER club in the
 * Outreach → Clubs directory (sport←activity_type, area←location,
 * open_to←audience; see lib/data/sheets.ts's getClubsDirectory()), just
 * looked up for the logged-in club's own row instead. Kennedy confirmed
 * (27 Aug) a club's own audience/location for matching purposes comes
 * from this same Dynamic Club Page Hub sheet, not from DASHBOARD (X)
 * (which has no area/audience column at all — a pre-existing, documented
 * gap). If the logged-in club has no row of its own on that sheet yet,
 * every field here is empty and both new scorers below correctly score 0
 * rather than throwing — this is a real data-completeness dependency,
 * not a code bug: every club needs its own Dynamic Club Page Hub row for
 * these two scores to mean anything.
 */
export function ownClubDirectoryFields(
  club: Club,
  directory: ClubDirectoryEntry[],
): { activity_type: string; location: string; audience: string[] } {
  const own = directory.find((d) => d.directory_id === club.club_id);
  return {
    activity_type: own?.sport ?? "",
    location: own?.area ?? "",
    audience: own?.open_to ?? [],
  };
}

/**
 * Club-to-club match score (Kennedy's request, 27 Aug, from
 * Match_Score_For_Clubs.pdf) — completely separate from the generic
 * matchScore() above, which stays in place for Brands/Sponsorship/
 * Opportunities. Three fields, each all-or-nothing (any overlap = full
 * points, per the PDF's flat point values with no partial-credit
 * column): activity_type 10, location 5, audience 10 — 25 points max.
 * Returns a 0–100 PERCENTAGE (points scored ÷ 25 × 100, rounded), not a
 * raw point count — Kennedy's own example: "10 out of 15" (his 25-point
 * total, confirmed 27 Aug — the 15 in his message was a typo) → the UI
 * always shows a percentage, never "10/25".
 */
export function clubToClubMatchScore(myClub: Club, otherClub: ClubDirectoryEntry, directory: ClubDirectoryEntry[]): number {
  const mine = ownClubDirectoryFields(myClub, directory);
  const MAX = 25;
  let points = 0;
  if (mine.activity_type && anyOverlap([mine.activity_type], [otherClub.sport])) points += 10;
  if (mine.location && anyOverlap([mine.location], [otherClub.area])) points += 5;
  if (mine.audience.length && anyOverlap(mine.audience, otherClub.open_to)) points += 10;
  return Math.round((points / MAX) * 100);
}

/**
 * Club-to-player match score (Kennedy's request, 27 Aug, from
 * Match_Score_For_Players.pdf) — six fields, all-or-nothing, 50 points
 * max: activity_type↔Favourite Activity 10, location↔Home Borough 10,
 * audience↔Gender 10, activity_type↔Other Activities Interested In 5,
 * tags↔Motivations 5, U notes↔Experience Level 10.
 *
 * Two rows are deliberately NOT literal field-for-field lookups —
 * Kennedy confirmed both explicitly (27 Aug follow-up):
 *   - "tags" (club side) has no equivalent on Club/ClubDirectoryEntry at
 *     all — the closest real signal for "does this player's motivation
 *     align with us" is the same activity_type/audience a club already
 *     has, so this row reuses activity_type-vs-interests as its check
 *     rather than inventing a field that doesn't exist anywhere. Kennedy
 *     confirmed keeping this mapping rather than always/never awarding
 *     the 5 points.
 *   - "U notes" is Kennedy's own private note (confirmed 27 Aug, same
 *     meaning as on the Suppliers sheet) — never a real matchable
 *     signal, and never shown to a club. Kennedy confirmed this row's 10
 *     points should always be awarded — a club is never penalised for a
 *     private note it can't see or affect — so the max stays a true 50.
 *
 * Returns a 0–100 percentage (points ÷ 50 × 100, rounded) — Kennedy's
 * own example: "45 out of 50" → 90%.
 */
export function clubToPlayerMatchScore(myClub: Club, player: Player, directory: ClubDirectoryEntry[]): number {
  const mine = ownClubDirectoryFields(myClub, directory);
  const MAX = 50;
  let points = 0;
  if (mine.activity_type && anyOverlap([mine.activity_type], player.sports)) points += 10;
  if (mine.location && anyOverlap([mine.location], [player.area])) points += 10;
  if (mine.audience.length && player.gender && anyOverlap(mine.audience, [player.gender])) points += 10;
  if (mine.activity_type && anyOverlap([mine.activity_type], player.interests)) points += 5;
  if (mine.audience.length && anyOverlap(mine.audience, player.interests)) points += 5;
  points += 10; // "U notes" row — Kennedy's own private note, always awarded (see doc comment above)
  return Math.round((points / MAX) * 100);
}

/** Match score 0–100. Entries missing data score on what exists — never error.
 *  Priorities-based tag scoring removed entirely (Kennedy, 20 Aug) — scores
 *  on sport/area/urgency only now. w.tag/w.tagCap are unused but kept on
 *  ScoreWeights (and the Config sheet) rather than deleted, since removing
 *  them would be a breaking schema change to Config for no functional gain. */
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
  if (sports.length && overlap(sports, [club.sport]) > 0) s += w.sport;
  if (areas.length && overlap(areas, [club.area]) > 0) s += w.area;
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
  // No priorities gate — recommendations are always available now that
  // priorities has been removed entirely (Kennedy, 20 Aug).
  //
  // Only sponsorships and opportunities (Kennedy's request, 25 Aug: "real
  // placeholder recommendation types now — funding + opportunities only").
  // players is still accepted as a parameter (callers haven't changed) but
  // is deliberately unused here now.
  const recs: Recommendation[] = [
    ...sponsorships.map((sp) => {
      // Same "complex" rule as the real Sponsorship & Funding page
      // (app/dashboard/[clubToken]/outreach/sponsorship/page.tsx) — kept
      // in sync deliberately so a recommendation's action_key/token_cost
      // always matches what clicking through to the full page would show.
      const complex = /grant|active communities/i.test(sp.title) || sp.eligibility_tags.length > 2;
      return {
        kind: "sponsorship" as const,
        id: sp.opportunity_id,
        title: sp.title,
        subtitle: `${sp.amount} · closes ${new Date(sp.closing_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
        score: matchScore(club, sp, w),
        action_key: complex ? "sponsorship_apply_complex" : "sponsorship_apply",
        action_label: sp.amount ? `Get us this ${sp.amount}` : "Apply on our behalf",
        token_cost: 3, // both simple and complex sponsorship applications now cost 3 (Kennedy, 27 Aug follow-up)
      };
    }),
    ...opportunities
      .filter((o) => o.status === "open")
      .map((o) => ({
        kind: "opportunity" as const,
        id: o.opportunity_id,
        title: o.title,
        subtitle: o.type,
        score: matchScore(club, o, w),
        action_key: "contact_us",
        action_label: `Ask us about "${o.title}"`,
        token_cost: 0,
        view_url: o.link || undefined,
      })),
  ];
  return recs.sort((a, b) => b.score - a.score).slice(0, limit);
}
