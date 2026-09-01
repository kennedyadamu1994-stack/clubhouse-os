import type { Club, Sponsorship, Opportunity, Player, Recommendation } from "./types";

/**
 * The old tagMatchScore() (Kennedy, 29 Aug — a single blended percentage:
 * matched tags ÷ club's own tag count × 100) was removed entirely on 1
 * Sep, along with MatchScoreBadge. It's not being kept dormant. The
 * reasoning, and its replacement, live in lib/relevance.ts: a single
 * blended number turned out to be fragile against messy, partially-filled,
 * formula-fed spreadsheet data (a malformed IMPORTRANGE/ARRAYFORMULA on
 * one club's real Tags cell was pulling in an entire unrelated club's
 * bio/FAQs/image URLs instead of real tags), and a wrong number is worse
 * than no number because it looks authoritative. v3 shows independently-
 * true "reason chips" instead (buildReasonChips) — see that file's doc
 * comment for the full history (v1 PDF-based point systems, v2 this tag
 * percentage, v3 the current chip system).
 */

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
  // No relevance signal here (1 Sep) — the v3 chip system shipped for
  // Players/Clubs/Brands only in this pass; Sponsorship & Funding and
  // Opportunities don't have reason chips yet (open question in the
  // handoff brief), so there's nothing meaningful to sort recommendations
  // by on that front. Sorted by nearest date instead (soonest-closing
  // sponsorship or soonest-dated opportunity first) — a real, always-
  // available ordering that doesn't require inventing a placeholder score.
  const recs: (Recommendation & { _sortDate: number })[] = [
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
        action_key: complex ? "sponsorship_apply_complex" : "sponsorship_apply",
        action_label: sp.amount ? `Get us this ${sp.amount}` : "Apply on our behalf",
        token_cost: 3, // both simple and complex sponsorship applications now cost 3 (Kennedy, 27 Aug follow-up)
        _sortDate: new Date(sp.closing_date).getTime(),
      };
    }),
    ...opportunities
      .filter((o) => o.status === "open")
      .map((o) => ({
        kind: "opportunity" as const,
        id: o.opportunity_id,
        title: o.title,
        subtitle: o.type,
        action_key: "contact_us",
        action_label: `Ask us about "${o.title}"`,
        token_cost: 0,
        view_url: o.link || undefined,
        _sortDate: new Date(o.date).getTime(),
      })),
  ];
  return recs
    .sort((a, b) => a._sortDate - b._sortDate)
    .slice(0, limit)
    .map(({ _sortDate, ...rec }) => rec);
}
