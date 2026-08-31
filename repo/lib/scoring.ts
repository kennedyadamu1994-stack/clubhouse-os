import type { Club, Sponsorship, Opportunity, Player, Recommendation } from "./types";

const overlap = (a: string[], b: string[]) =>
  a.filter((t) => b.map((x) => x.toLowerCase().trim()).includes(t.toLowerCase().trim())).length;

/**
 * THE match score, rebuilt from scratch (Kennedy, 29 Aug) — replaces
 * EVERY previous scoring system in this file: the generic sport/area/
 * urgency matchScore(), and the two PDF-based point systems
 * (clubToClubMatchScore, clubToPlayerMatchScore) that scored fixed fields
 * like activity_type/location/audience with flat point values. Kennedy's
 * explicit instruction: discard those entirely, don't layer tags on top.
 *
 * Every sheet in "THE ULTIMATE NBRH CLUB HOUSE OS DATABASE" now has a real
 * "tags" column (comma-separated on every entity except the club's own —
 * see Club.tags's own doc comment for the dash-separated exception), so
 * matching is now: how many of MY CLUB'S tags appear anywhere in this
 * entry's tags. Case/whitespace-insensitive exact-value matching (not a
 * substring match like the old location-specific anyLooseOverlap) — tags
 * are short, deliberate keyword phrases, not free text, so exact matching
 * is the right level of strictness here.
 *
 * Score = (tags matched ÷ my club's total tag count) × 100, rounded.
 * Kennedy's explicit choice (29 Aug) over dividing by the ENTRY's tag
 * count — deliberately, to avoid a sparsely-tagged entry scoring
 * artificially high just for having few tags, and so scores stay
 * comparable across different entries browsed in the same session (the
 * denominator never changes — it's always my club's own tag count).
 *
 * Returns 0 when the CLUB has no tags at all (nothing to divide by, not a
 * crash) — this is the expected state for any club until the new "Tags"
 * column on DASHBOARD (X) is filled in for them, not an error condition.
 */
export function tagMatchScore(club: Club, entryTags: string[]): number {
  const myTags = club.tags ?? [];
  if (myTags.length === 0) return 0;
  const matched = overlap(myTags, entryTags);
  return Math.round((matched / myTags.length) * 100);
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
  limit = 5,
): Recommendation[] {
  // No priorities gate — recommendations are always available now that
  // priorities has been removed entirely (Kennedy, 20 Aug).
  //
  // Only sponsorships and opportunities (Kennedy's request, 25 Aug: "real
  // placeholder recommendation types now — funding + opportunities only").
  // players is still accepted as a parameter (callers haven't changed) but
  // is deliberately unused here now.
  //
  // Scoring rebuilt onto tagMatchScore (Kennedy, 29 Aug) — the old
  // sport/area/urgency matchScore() and its ScoreWeights parameter are
  // both gone; this function no longer takes a weights argument at all.
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
        score: tagMatchScore(club, sp.tags),
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
        score: tagMatchScore(club, o.tags),
        action_key: "contact_us",
        action_label: `Ask us about "${o.title}"`,
        token_cost: 0,
        view_url: o.link || undefined,
      })),
  ];
  return recs.sort((a, b) => b.score - a.score).slice(0, limit);
}
