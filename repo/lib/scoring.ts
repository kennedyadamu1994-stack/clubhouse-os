import type {
  Club,
  Sponsorship,
  Player,
  Person,
  Brand,
  Influencer,
  ClubDirectoryEntry,
  Supplier,
  SocialVenue,
  Recommendation,
} from "./types";

/**
 * Parses the real "U notes" column into a list of Club IDs (7 Sep —
 * Kennedy's manual recommendation-targeting system, replacing the old
 * automatic chip-matching entirely). Kennedy fills this cell with the
 * Club IDs of every club that row should be recommended to, separated
 * by " - " (his own example: "BB Club - A Club" recommends that single
 * row to both clubs' Overview pages).
 *
 * Genuinely a NEW field (recommended_for_club_ids), not a repurposing of
 * the existing internal_notes field already wired in for Supplier and
 * SocialVenue — those kept their old field name and doc comment
 * (private notes, never club-facing) rather than being silently
 * redefined out from under existing code, even though Kennedy confirmed
 * he doesn't actually use internal_notes for private notes today. Every
 * one of the 8 Outreach categories' own rowTo* function calls this same
 * parser directly against the real "U notes" column, so the splitting
 * logic (trim whitespace, drop empty segments from stray/double
 * separators) exists in exactly one place rather than 8 copies that
 * could drift apart.
 *
 * Deliberately case-sensitive and exact-match against real Club IDs —
 * no fuzzy matching, no name-based fallback, since Kennedy confirmed
 * Club ID (not club name) is what actually goes in this column.
 */
export function parseRecommendedForClubIds(uNotes: string | undefined | null): string[] {
  if (!uNotes) return [];
  return uNotes
    .split(" - ")
    .map((id) => id.trim())
    .filter(Boolean);
}

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
 * percentage, v3 the current 4-bucket chip system).
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

/**
 * Manual recommendation system (8 Sep — Kennedy: "for the top
 * recommendations, can this be a manual thing"), fully replacing the
 * old automatic chip-matching topRecommendations. Kennedy fills in the
 * real "U notes" column on any row, on any of the 8 Outreach sheets,
 * with the Club IDs of every club that row should be recommended to
 * (parseRecommendedForClubIds handles the actual parsing — see its own
 * doc comment). This function just filters every category down to rows
 * naming this club, in one combined list.
 *
 * Every recommendation's action_key/token_cost/label mirrors that
 * category's own Outreach page exactly (Players' invite, People's
 * booking, Brands' pitch, Influencers' outreach, Clubs' outreach,
 * Suppliers' outreach, Social Venues' outreach, Sponsorship's apply) —
 * kept in sync deliberately, the same principle the old sponsorship-only
 * version of this function already followed, so a recommendation card
 * always drives the identical action clicking through to the full
 * listing would.
 *
 * No relevance sorting, no minimum-match threshold — this is entirely
 * Kennedy's own manual curation now, so every tagged row qualifies, in
 * whatever order the underlying sheets return them, sliced to `limit`.
 */
export function topRecommendations(
  club: Club,
  sponsorships: Sponsorship[],
  players: Player[],
  people: Person[],
  brands: Brand[],
  influencers: Influencer[],
  clubsDirectory: ClubDirectoryEntry[],
  suppliers: Supplier[],
  socialVenues: SocialVenue[],
  limit = 5,
): Recommendation[] {
  const forThisClub = (ids: string[]) => ids.includes(club.club_id);

  const candidates: Recommendation[] = [
    ...sponsorships
      .filter((sp) => forThisClub(sp.recommended_for_club_ids))
      .map((sp): Recommendation => {
        // Same "complex" rule as the real Sponsorship & Funding page —
        // kept in sync deliberately, same reasoning as this function's
        // own doc comment.
        const complex = /grant|active communities/i.test(sp.title) || sp.eligibility_tags.length > 2;
        return {
          kind: "sponsorship",
          id: sp.opportunity_id,
          title: sp.title,
          subtitle: `${sp.amount} · closes ${sp.closing_date}`,
          chips: [],
          action_key: complex ? "sponsorship_apply_complex" : "sponsorship_apply",
          action_label: sp.amount ? `Get us this ${sp.amount}` : "Apply on our behalf",
          token_cost: 3,
        };
      }),
    ...players
      .filter((p) => forThisClub(p.recommended_for_club_ids))
      .map(
        (p): Recommendation => ({
          kind: "player",
          id: p.player_id,
          title: p.name ?? `Player in ${p.area}`,
          subtitle: `${p.sports.join(", ")} · ${p.level}`,
          chips: [],
          action_key: "player_invite",
          action_label: "Invite them to trial with us",
          token_cost: 1,
        }),
      ),
    ...people
      .filter((p) => forThisClub(p.recommended_for_club_ids))
      .map((p): Recommendation => {
        const label = p.role.charAt(0).toUpperCase() + p.role.slice(1).replace(/_/g, " ");
        return {
          kind: "person",
          id: p.person_id,
          title: p.name ?? `${label} in ${p.area}`,
          subtitle: `${label} · ${p.area}`,
          chips: [],
          action_key: "person_request",
          action_label: `Book this ${label.toLowerCase()}`,
          token_cost: 2,
        };
      }),
    ...brands
      .filter((b) => forThisClub(b.recommended_for_club_ids))
      .map(
        (b): Recommendation => ({
          kind: "brand",
          id: b.brand_id,
          title: b.name,
          subtitle: b.sectors.join(", "),
          chips: [],
          action_key: b.type === "corporate" ? "brand_outreach_corporate" : "brand_outreach_local",
          action_label: `We'll pitch ${b.name} for you`,
          token_cost: 3,
        }),
      ),
    ...influencers
      .filter((inf) => forThisClub(inf.recommended_for_club_ids))
      .map(
        (inf): Recommendation => ({
          kind: "influencer",
          id: inf.influencer_id,
          title: inf.name,
          subtitle: `${inf.platforms.join(", ")} · ${inf.follower_band}`,
          chips: [],
          action_key: "influencer_outreach",
          action_label: `We'll reach out to ${inf.name.replace("@", "")}`,
          token_cost: 3,
        }),
      ),
    ...clubsDirectory
      .filter((c) => forThisClub(c.recommended_for_club_ids))
      .map(
        (c): Recommendation => ({
          kind: "club",
          id: c.directory_id,
          title: c.name,
          subtitle: `${c.sport} · ${c.area}`,
          chips: [],
          action_key: "club_outreach",
          action_label: `We'll set it up with ${c.name}`,
          token_cost: 2,
        }),
      ),
    ...suppliers
      .filter((s) => forThisClub(s.recommended_for_club_ids))
      .map(
        (s): Recommendation => ({
          kind: "supplier",
          id: s.supplier_id,
          title: s.name,
          subtitle: s.product_categories.join(", "),
          chips: [],
          action_key: "supplier_outreach",
          action_label: `We'll reach out to ${s.name} for you`,
          token_cost: 1,
        }),
      ),
    ...socialVenues
      .filter((v) => forThisClub(v.recommended_for_club_ids))
      .map(
        (v): Recommendation => ({
          kind: "social_venue",
          id: v.venue_id,
          title: v.name,
          subtitle: v.venue_type,
          chips: [],
          action_key: "venue_outreach",
          action_label: `We'll set it up with ${v.name}`,
          token_cost: 2,
        }),
      ),
  ];

  return candidates.slice(0, limit);
}
