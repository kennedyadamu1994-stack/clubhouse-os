import type { Club } from "./types";

/**
 * v3 relevance system (Kennedy, 1 Sep, revised 1 Sep) — replaces
 * tagMatchScore() and the 0-100% MatchScoreBadge entirely, per the
 * Relevance Rebuild handoff brief, then narrowed from "one chip per
 * matched tag" to exactly 4 fixed buckets (Kennedy's follow-up edit,
 * same day): Sport, Location, Audience (age band), and Gender. Every raw
 * tag string gets keyword-classified into one of these four buckets (or
 * none, if it doesn't match any keyword) — there's no free-form 5th+
 * bucket any more, and a matched tag never becomes its own chip.
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
 * v3 shows up to 4 short, independently-true "reason chips" per entry
 * instead: "Same Sport", "Same Location", "Same Audience", "Same
 * Gender". No blending, no weighting, no percentage. An entry with no
 * matches just shows no chips — visibly less relevant, not a
 * broken-looking 0%.
 */
export const MAX_CHIPS = 4;

export type RelevanceBucket = "sport" | "location" | "audience" | "gender";

export interface ReasonChip {
  label: string;
  bucket: RelevanceBucket;
}

const norm = (v: string) => v.trim().toLowerCase();

const BUCKET_LABEL: Record<RelevanceBucket, string> = {
  sport: "Same Sport",
  location: "Same Location",
  audience: "Same Audience",
  gender: "Same Gender",
};

/* ------------------------------------------------------------------ *
 * Gender bucket — keyword-classified, Male/Female only (Kennedy, 1
 * Sep: "some may be stated as female students or women etc, but this
 * should all be in the same bucket, the main split just needs to be
 * male or female"). A tag/value that matches neither keyword set
 * (e.g. "Non-binary", "Mixed") simply doesn't land in a gender bucket —
 * it's not an error, it just can't earn a Gender chip either way.
 * ------------------------------------------------------------------ */
export type GenderBucket = "male" | "female";

const FEMALE_KEYWORDS = ["female", "women", "woman", "girls", "girl"];
const MALE_KEYWORDS = ["male", "men", "man", "boys", "boy"];

function classifyGender(value: string): GenderBucket | null {
  const v = norm(value);
  // Female checked first: "female" contains "male" as a substring, so a
  // naive male-keyword check would misfire on "female" if run first.
  if (FEMALE_KEYWORDS.some((k) => v.includes(k))) return "female";
  if (MALE_KEYWORDS.some((k) => v.includes(k))) return "male";
  return null;
}

/* ------------------------------------------------------------------ *
 * Audience bucket — age band, keyword-classified into broad ranges
 * (Kennedy, 1 Sep: "bucket into broad ranges and match on the
 * bucket"). Cutoffs confirmed with Kennedy: youth under 18, adult
 * 18-45, senior 45+. Tags are matched by keyword (e.g. "U18", "under
 * 18", "youth", "senior", "over 45"); a real numeric age (Player.age)
 * is matched directly against the same cutoffs.
 * ------------------------------------------------------------------ */
export type AudienceBucket = "youth" | "adult" | "senior";

const YOUTH_ADULT_CUTOFF = 18;
const ADULT_SENIOR_CUTOFF = 45;

function audienceFromAge(age: number): AudienceBucket {
  if (age < YOUTH_ADULT_CUTOFF) return "youth";
  if (age < ADULT_SENIOR_CUTOFF) return "adult";
  return "senior";
}

// Matches "U18", "U-18", "under 18" style tags and pulls out the number,
// so any cutoff-adjacent tag ("U12", "U16", "under 21") classifies
// correctly against the same youth/adult/senior bands rather than only
// ever recognising the literal string "u18".
// "s?" before the trailing \b tolerates common real-world plural phrasing
// ("U18s", "Under 18s"), not just the singular form.
const UNDER_AGE_PATTERN = /\bu-?(\d{1,2})s?\b|\bunder\s?-?(\d{1,2})s?\b/i;
// "s?" tolerates the common real-world phrasing "Over 45s" (plural age
// band), not just "Over 45". The trailing \b is deliberately omitted from
// the "N+" branch — "+" is a non-word character at the end of the string,
// so \b directly after it never matches (no word/non-word transition to
// anchor on), which silently broke "45+" entirely until this fix.
const OVER_AGE_PATTERN = /\bover\s?-?(\d{1,2})s?\b|\b(\d{1,2})\+/i;
const SENIOR_KEYWORDS = ["senior", "veteran", "veterans", "masters"];
const YOUTH_KEYWORDS = ["youth", "junior", "juniors", "kids", "children"];
const ADULT_KEYWORDS = ["adult", "adults", "open age"];

function classifyAudienceTag(value: string): AudienceBucket | null {
  const v = norm(value);

  const underMatch = v.match(UNDER_AGE_PATTERN);
  if (underMatch) {
    const n = Number(underMatch[1] ?? underMatch[2]);
    // "under N" / "U-N" describes a band that TOPS OUT just below N (e.g.
    // "U18" means ages up to 17), so the actual oldest age in the band is
    // n-1 — classify on that, not on n itself. Feeding n directly would
    // put "U18" on the adult side of the youth/adult cutoff (18), which
    // is exactly backwards from what the tag means.
    if (!Number.isNaN(n)) return audienceFromAge(Math.max(0, n - 1));
  }
  const overMatch = v.match(OVER_AGE_PATTERN);
  if (overMatch) {
    const n = Number(overMatch[1] ?? overMatch[2]);
    // "over N" / "N+" describes the youngest age IN the band, e.g. "over
    // 45" means 45 and up — feed n directly into the same cutoffs rather
    // than n-1, so "over 45" lands on the senior side of the boundary.
    if (!Number.isNaN(n)) return audienceFromAge(n);
  }
  if (SENIOR_KEYWORDS.some((k) => v.includes(k))) return "senior";
  if (YOUTH_KEYWORDS.some((k) => v.includes(k))) return "youth";
  if (ADULT_KEYWORDS.some((k) => v.includes(k))) return "adult";
  return null;
}

/** First audience bucket found across a list of tags, or null if none classify. */
function audienceFromTags(tags: string[]): AudienceBucket | null {
  for (const t of tags) {
    const bucket = classifyAudienceTag(t);
    if (bucket) return bucket;
  }
  return null;
}

/** First gender bucket found across a list of tags, or null if none classify. */
function genderFromTags(tags: string[]): GenderBucket | null {
  for (const t of tags) {
    const bucket = classifyGender(t);
    if (bucket) return bucket;
  }
  return null;
}

const includesLoose = (list: string[], value: string): boolean => {
  const target = norm(value);
  if (!target) return false;
  return list.some((v) => norm(v) === target);
};

/**
 * A club's own Audience/Gender values aren't real dedicated fields yet
 * (only individual Players have those) — Kennedy's call, 1 Sep: infer
 * them from the club's own dash-separated Tags column, the same way an
 * entry's tags are read. Returns null for either when nothing in the
 * club's tags classifies, which simply means that bucket can never earn
 * a chip for this club yet (not an error).
 */
function clubAudience(club: Club): AudienceBucket | null {
  return audienceFromTags(club.tags ?? []);
}
function clubGender(club: Club): GenderBucket | null {
  return genderFromTags(club.tags ?? []);
}

/**
 * Days-until-close, floored at 0 for already-closed entries. Deadline
 * urgency was folded into the old chip system's priority list but isn't
 * one of the 4 confirmed buckets any more — kept here as a still-useful
 * standalone helper for anything (e.g. sort order, "closing soon" copy)
 * that wants it, but buildReasonChips() below no longer emits a deadline
 * chip itself.
 */
export function daysUntil(dateStr: string, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - now.getTime()) / 86_400_000));
}

export interface RelevanceInput {
  /** Entry's own sport, if it has a single-sport-shaped field (e.g. ClubDirectoryEntry.sport). */
  sport?: string | null;
  /** Entry's own sports list, for entries that can span more than one (e.g. Sponsorship.sports, Player.sports). */
  sports?: string[];
  /** Entry's own area. */
  area?: string | null;
  /** Entry's own real age, when a dedicated numeric field exists (Player.age) — preferred over guessing from tags when present. */
  age?: number | null;
  /** Entry's own real gender, when a dedicated field exists (Player.gender) — preferred over guessing from tags when present. Values outside Male/Female (e.g. "Non-binary") simply can't earn a Gender chip. */
  gender?: string | null;
  /** Entry's own tags — used as the fallback source for Audience/Gender when no dedicated field is given, and as the only source for entities that don't have one (Sponsorship, Opportunity, Brand, Influencer, ClubDirectoryEntry). */
  tags?: string[];
}

/**
 * Builds this entry's reason chips against a club's profile — exactly the
 * 4 confirmed buckets (Sport, Location, Audience, Gender), each shown at
 * most once, in that priority order, capped at MAX_CHIPS (currently 4,
 * so in practice every matching bucket gets shown). Any input can be
 * omitted (an entry without a sport field just can't earn a Sport chip)
 * — missing data means fewer chips, never an error or a misleading one.
 */
export function buildReasonChips(club: Club, input: RelevanceInput): ReasonChip[] {
  const chips: ReasonChip[] = [];

  // 1. Sport
  const sportMatch =
    (input.sport != null && includesLoose([club.sport], input.sport)) ||
    (input.sports?.length ? includesLoose(input.sports, club.sport) : false);
  if (sportMatch) chips.push({ label: BUCKET_LABEL.sport, bucket: "sport" });

  // 2. Location
  if (input.area != null && includesLoose([club.area], input.area)) {
    chips.push({ label: BUCKET_LABEL.location, bucket: "location" });
  }

  // 3. Audience (age band) — prefer a real age field when given, else
  // classify from tags.
  const entryAudience =
    input.age != null ? audienceFromAge(input.age) : audienceFromTags(input.tags ?? []);
  if (entryAudience != null && entryAudience === clubAudience(club)) {
    chips.push({ label: BUCKET_LABEL.audience, bucket: "audience" });
  }

  // 4. Gender — prefer a real gender field when given, else classify
  // from tags.
  const entryGender =
    input.gender != null ? classifyGender(input.gender) : genderFromTags(input.tags ?? []);
  if (entryGender != null && entryGender === clubGender(club)) {
    chips.push({ label: BUCKET_LABEL.gender, bucket: "gender" });
  }

  return chips.slice(0, MAX_CHIPS);
}

/**
 * Sort weight for an entry: just its chip count. More matching chips
 * sorts higher — a soft ordering, not purely decorative (confirmed with
 * Kennedy, 1 Sep). Also what Top Recommendations' 2+-match filter uses
 * (see lib/scoring.ts) — kept as a tiny named export rather than
 * inlining `.length` at every call site so the "chip count IS the sort/
 * filter value" decision lives in one place.
 */
export function relevanceSortValue(chips: ReasonChip[]): number {
  return chips.length;
}
