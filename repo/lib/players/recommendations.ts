import type { Player } from "@/lib/types";
import {
  fetchCategoryItems,
  type Item,
  type Category as EngineCategory,
} from "@/components/nbrh-engine";
import {
  classifyGender,
  audienceFromAge,
  audienceFromTags,
  genderFromTags,
  includesLoose,
  type ReasonChip,
  type RelevanceBucket,
  MAX_CHIPS,
} from "@/lib/relevance";

/**
 * Recommendations' own matching engine (15 Sep) — same 4-bucket
 * reason-chip idea as lib/relevance.ts's buildReasonChips (Sport,
 * Location, Audience, Gender), but a dedicated function rather than a
 * call to buildReasonChips itself, which is hard-typed to compare an
 * entry against a real Club (club.sport, club.area, clubAudience(club),
 * clubGender(club) are all baked into its body) — a player has none of
 * those fields. Reuses every piece of that module that IS genuinely
 * generic (classifyGender, audienceFromAge/FromTags, genderFromTags,
 * includesLoose — all exported 15 Sep specifically for this), so the
 * real classification keyword lists only exist in one place; only the
 * "compare against what" part differs.
 *
 * Recommendations only ever runs client-side (this file is imported
 * from a "use client" page) — it calls fetchCategoryItems, the same
 * function NbrhEngine's own Search uses, which fetches directly from
 * the public opensheet.elk.sh endpoint in the browser. There is no
 * server-side equivalent anywhere in this codebase (Search's own data
 * was never wired through lib/data — see nbrh-engine.tsx's own top-of-
 * file doc comment), so this follows that same established pattern
 * rather than inventing a new one.
 */

const BUCKET_LABEL: Record<RelevanceBucket, string> = {
  sport: "Same Sport",
  location: "Same Location",
  audience: "Same Audience",
  gender: "Same Gender",
};

export interface Recommendation {
  item: Item;
  chips: ReasonChip[];
}

function buildPlayerReasonChips(player: Player, item: Item): ReasonChip[] {
  const chips: ReasonChip[] = [];

  // 1. Sport — player.sports (Favourite Activity + Other Activities
  // Interested In are combined by the caller before this runs) against
  // the item's own sport field.
  if (item.sport && includesLoose(player.sports, item.sport)) {
    chips.push({ label: BUCKET_LABEL.sport, bucket: "sport" });
  }

  // 2. Location — player.area (Home Borough) against the item's own
  // location/borough field. Items use "location" (Activities/Clubs/etc)
  // or "borough" (some categories) — checked against both, since which
  // field is populated varies by category/mapper.
  if (player.area && (includesLoose([item.location], player.area) || includesLoose([item.borough], player.area))) {
    chips.push({ label: BUCKET_LABEL.location, bucket: "location" });
  }

  // 3. Audience (age band) — prefers the player's real numeric age when
  // set, same preference order as buildReasonChips' own club version.
  const playerAudience = player.age != null ? audienceFromAge(player.age) : audienceFromTags([player.level]);
  const itemAudience = audienceFromTags([item.ageGroups, item.skillLevel]);
  if (playerAudience != null && itemAudience != null && playerAudience === itemAudience) {
    chips.push({ label: BUCKET_LABEL.audience, bucket: "audience" });
  }

  // 4. Gender — prefers the player's real gender field when set.
  const playerGender = player.gender != null ? classifyGender(player.gender) : null;
  const itemGender = genderFromTags([item.audience]);
  if (playerGender != null && itemGender != null && playerGender === itemGender) {
    chips.push({ label: BUCKET_LABEL.gender, bucket: "gender" });
  }

  return chips.slice(0, MAX_CHIPS);
}

const RECOMMENDATION_CATEGORIES: EngineCategory[] = ["Activities", "Clubs", "Leagues", "Events"];

/**
 * Fetches Activities/Clubs/Leagues/Events (15 Sep — Venues and People
 * deliberately excluded: Kennedy's own spec for Recommendations names
 * Activities/Clubs/Leagues/Events as the match targets, not the full
 * six-category Search set) and scores every item against this player's
 * real profile fields (Favourite Activity, Home Borough, Experience
 * Level, Other Activities Interested In — Availability isn't one of
 * the 4 relevance buckets, so it doesn't feed chip-matching the way it
 * feeds Search's own filters). Only returns items with 2+ matching
 * chips, sorted by chip count — same "genuinely relevant, not just any
 * match" bar as CHOS's own Top Recommendations panel (the Recommendation
 * type's own doc comment, lib/types.ts), reused here as a deliberate
 * consistency choice, not a coincidence.
 * Can legitimately return an empty array — an incomplete player
 * profile, or simply no items matching on 2+ independent axes, is a
 * real, valid outcome, never padded to look non-empty.
 */
export async function buildRecommendations(player: Player): Promise<Recommendation[]> {
  const playerWithCombinedSports: Player = {
    ...player,
    sports: [...player.sports, ...player.interests],
  };

  const results = await Promise.all(
    RECOMMENDATION_CATEGORIES.map(async (cat) => {
      const items = await fetchCategoryItems(cat);
      return items.map((item) => ({
        item,
        chips: buildPlayerReasonChips(playerWithCombinedSports, item),
      }));
    }),
  );

  return results
    .flat()
    .filter((r) => r.chips.length >= 2)
    .sort((a, b) => b.chips.length - a.chips.length);
}
