import type { Club } from "./types";

/**
 * v3 relevance system (Kennedy, 1 Sep) — replaces tagMatchScore() and the
 * 0-100% MatchScoreBadge entirely, per the Relevance Rebuild handoff brief.
 *
 * The problem with v1 (fixed-field point systems) and v2 (tags ÷ club's
 * tag count, as a single blended percentage) was never the maths. It was
 * that a single blended number depends on every input being clean and
 * complete, and this sheet's data isn't reliable enough for that yet — a
 * malformed IMPORTRANGE/ARRAYFORMULA on one club's real Tags cell was
 * pulling in an entire unrelated club's bio/FAQs/image URLs instead of
 * real tags, and a wrong number is worse than no number because it looks
 * authoritative.
 *
 * v3 shows 1-4 short, independently-true "reason chips" per entry instead:
 * "Same sport", "Same area", "Closing in 5 days", plus one chip per
 * individually matched tag (e.g. "Basketball", "Female" as two separate
 * chips, never a combined "2 tags match" summary — Kennedy's explicit call
 * on this, 1 Sep). No blending, no weighting, no percentage. An entry with
 * no matches just shows no chips — visibly less relevant, not a
 * broken-looking 0%.
 *
 * Priority order when filling the (confirmed) 4-chip cap: sport, area,
 * deadline urgency, then tags fill whatever slots remain — sport/area/
 * deadline are the most reliable signals so they always win a slot first.
 */
export const MAX_CHIPS = 4;

/** "reliable" = sport/area/deadline (curated fields); "tag" = an individual matched tag. Kept distinct so the UI can style them differently (open question 3 in the handoff — reliable signals should read as more certain than a raw tag match). */
export type ReasonChipKind = "reliable" | "tag";

export interface ReasonChip {
  label: string;
  kind: ReasonChipKind;
}

const norm = (v: string) => v.trim().toLowerCase();

/** Case/whitespace-insensitive membership check — same normalisation tagMatchScore used, kept identical so behaviour doesn't quietly shift for entries that already relied on it. */
function includesLoose(list: string[], value: string): boolean {
  const target = norm(value);
  if (!target) return false;
  return list.some((v) => norm(v) === target);
}

/** Every matched tag between the club's own tags and an entry's tags, case/whitespace-insensitive, de-duplicated, in the entry's own tag order (so chip order is stable and matches how the entry lists them). */
function matchedTags(clubTags: string[], entryTags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of entryTags) {
    const key = norm(tag);
    if (!key || seen.has(key)) continue;
    if (includesLoose(clubTags, tag)) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out;
}

/**
 * Days-until-close, floored at 0 for already-closed entries. Mirrors the
 * old urgency logic (closing within ~30 days = worth flagging).
 */
function daysUntil(dateStr: string, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - now.getTime()) / 86_400_000));
}

const URGENCY_WINDOW_DAYS = 30;

export interface RelevanceInput {
  /** Entry's own sport, if it has a single-sport-shaped field (e.g. ClubDirectoryEntry.sport). Omit for entries with no sport field at all (e.g. Opportunity). */
  sport?: string | null;
  /** Entry's own sports list, for entries that can span more than one (e.g. Sponsorship.sports, Player.sports). */
  sports?: string[];
  /** Entry's own area. */
  area?: string | null;
  /** Closing/deadline date (ISO-ish string) — e.g. Sponsorship.closing_date. Omit for entries with no deadline. */
  closingDate?: string | null;
  /** Entry's own tags (already parsed via toList/toDashList + filterContextualTags upstream). */
  tags?: string[];
}

/**
 * Builds this entry's reason chips against a club's profile. Fills the
 * MAX_CHIPS cap in priority order: sport, area, deadline urgency, then one
 * chip per matched tag for any slots left over. Any input can be omitted
 * (an entry without a sport field just can't earn a sport chip) — missing
 * data means fewer chips, never an error or a misleading chip.
 */
export function buildReasonChips(club: Club, input: RelevanceInput): ReasonChip[] {
  const chips: ReasonChip[] = [];

  // 1. Sport — most reliable, checked first.
  const sportMatch =
    (input.sport != null && includesLoose([club.sport], input.sport)) ||
    (input.sports?.length ? includesLoose(input.sports, club.sport) : false);
  if (sportMatch) chips.push({ label: "Same sport", kind: "reliable" });

  // 2. Area — second priority.
  if (input.area != null && includesLoose([club.area], input.area)) {
    chips.push({ label: "Same area", kind: "reliable" });
  }

  // 3. Deadline urgency — third priority (closing within ~30 days).
  if (input.closingDate) {
    const days = daysUntil(input.closingDate);
    if (days <= URGENCY_WINDOW_DAYS) {
      chips.push({
        label: days === 0 ? "Closing today" : days === 1 ? "Closing tomorrow" : `Closing in ${days} days`,
        kind: "reliable",
      });
    }
  }

  // 4. Individual matched tags fill whatever slots remain — one chip per
  // tag, never a combined summary.
  if (chips.length < MAX_CHIPS && input.tags?.length) {
    const remaining = MAX_CHIPS - chips.length;
    for (const tag of matchedTags(club.tags ?? [], input.tags).slice(0, remaining)) {
      chips.push({ label: tag, kind: "tag" });
    }
  }

  return chips.slice(0, MAX_CHIPS);
}

/**
 * Sort weight for an entry: just its chip count. More matching chips
 * sorts higher — a soft ordering, not purely decorative (confirmed with
 * Kennedy, 1 Sep). Kept as a tiny named export rather than inlining
 * `.length` at every call site so the "chip count IS the sort value"
 * decision lives in one place.
 */
export function relevanceSortValue(chips: ReasonChip[]): number {
  return chips.length;
}
