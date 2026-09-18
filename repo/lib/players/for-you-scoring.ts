import type { Player } from "@/lib/types";
import { fetchCategoryItems, type Item } from "@/components/nbrh-engine";

/**
 * "For You" scoring engine (15 Sep, replacing the earlier reason-chip
 * version) — a direct, faithful port of the real scoring algorithm
 * Kennedy provided (the standalone "Your Sessions" recommendations
 * widget): sportMatches, skillMatches, motivationMatches, genderCompat,
 * scoreSession, scoreToPercent. Every function below mirrors that
 * source's own logic and constants exactly, not a paraphrase — where
 * this differs from the original, it's ONLY in what data it reads
 * from (Item, this app's own already-fetched/parsed shape, instead of
 * raw Core Sessions rows fetched directly via the Sheets API with a
 * hardcoded key), never in the matching logic itself.
 *
 * Scoped to Activities/Core Sessions only (Kennedy, 15 Sep, confirming
 * the attached code's own real scope — it never scores Clubs/Leagues/
 * Events, only sessions) — reuses fetchCategoryItems("Activities"),
 * the same fetch+filter pipeline Search's own Activities tab uses
 * (Session Status === "General Access", same as the original's own
 * EXCLUDE_STATUSES/status check).
 *
 * IMPORTANT field-mapping note: Item's skillLevel/ageGroups fields are
 * hardcoded empty strings for the Activities category specifically
 * (see mapActivity, components/nbrh-engine.tsx) — Activities instead
 * populates difficulty/ageGroup. Every field read below uses the
 * REAL populated field for Activities, not the generically-named one
 * that happens to exist on the Item type but is blank for this
 * category — confirmed against mapActivity's own real column mapping
 * before writing this, not assumed.
 */

const SPORT_EMOJIS: Record<string, string> = {
  basketball: "🏀",
  football: "⚽", soccer: "⚽",
  tennis: "🎾",
  running: "🏃", run: "🏃",
  swimming: "🏊", swim: "🏊",
  yoga: "🧘", pilates: "🧘",
  boxing: "🥊", kickboxing: "🥊", "martial arts": "🥊", mma: "🥊",
  gym: "💪", fitness: "💪", hiit: "💪", weights: "💪", strength: "💪",
  cycling: "🚴", spin: "🚴", cycle: "🚴",
  dance: "💃", dancing: "💃",
  rugby: "🏉",
  cricket: "🏏",
  netball: "🏐", volleyball: "🏐",
  badminton: "🏸", squash: "🏸",
  climbing: "🧗",
  skiing: "⛷️", ski: "⛷️",
};

export function getSportEmoji(activity: string = ""): string {
  const a = activity.toLowerCase();
  for (const [k, v] of Object.entries(SPORT_EMOJIS)) {
    if (a.includes(k)) return v;
  }
  return "🏅";
}

const LONDON_REGIONS: Record<string, string[]> = {
  East: ["hackney", "tower hamlets", "newham", "waltham forest", "redbridge", "barking", "dagenham", "havering"],
  West: ["hammersmith", "fulham", "ealing", "hounslow", "brent", "hillingdon", "harrow"],
  North: ["camden", "islington", "haringey", "enfield", "barnet"],
  South: ["lambeth", "southwark", "lewisham", "greenwich", "bromley", "croydon", "sutton", "merton"],
  Central: ["westminster", "kensington", "chelsea", "city of london"],
};

function getRegion(borough: string): string | null {
  if (!borough) return null;
  const b = borough.toLowerCase();
  for (const [region, boroughs] of Object.entries(LONDON_REGIONS)) {
    if (boroughs.some((x) => b.includes(x))) return region;
  }
  return null;
}

function genderCompat(audience: string = "", userGender: string = ""): "excluded" | "bonus" | "neutral" {
  const a = audience.toLowerCase();
  const g = userGender.toLowerCase();
  const isWomenOnly = ["women only", "women", "female"].some((x) => a === x);
  const isMenOnly = ["men only", "men", "male"].some((x) => a === x);
  if (isWomenOnly && (g === "male" || g === "man" || g === "m")) return "excluded";
  if (isMenOnly && (g === "female" || g === "woman" || g === "f" || g === "non-binary")) return "excluded";
  if (isWomenOnly && (g === "female" || g === "woman" || g === "f")) return "bonus";
  if (isMenOnly && (g === "male" || g === "man" || g === "m")) return "bonus";
  return "neutral";
}

const KIDS_TERMS = ["kids", "children", "child", "youth", "junior", "u16", "u18", "u14", "under 16", "under 18"];
function isKidsSession(item: Item): boolean {
  const hay = `${item.name} ${item.ageGroup}`.toLowerCase();
  return KIDS_TERMS.some((t) => hay.includes(t));
}

const FOOTBALL_EXCLUSIONS = ["american football", "flag football", "gaelic football", "touch football", "aussie rules"];

function sportMatches(sessionActivity: string = "", sessionName: string = "", userSports: string[] = []): boolean {
  if (!userSports.length) return false;
  const sa = sessionActivity.toLowerCase();
  const sn = sessionName.toLowerCase();
  for (const us of userSports) {
    const u = us.toLowerCase().trim();
    if (!u) continue;
    if (u === "football" || u === "soccer") {
      if (FOOTBALL_EXCLUSIONS.some((ex) => sa.includes(ex) || sn.includes(ex))) continue;
      if (sa.includes("football") || sa.includes("soccer") || sn.includes("football") || sn.includes("soccer")) return true;
      continue;
    }
    if (sa.includes(u) || sn.includes(u)) return true;
  }
  return false;
}

const ALL_LEVELS = ["all levels", "mixed ability", "all abilities", "open level", "all level", "beginner friendly", "everyone"];
function skillMatches(expLevel: string = "", difficulty: string = "", className: string = ""): boolean {
  const hay = `${difficulty} ${className}`.toLowerCase();
  const el = expLevel.toLowerCase();
  if (ALL_LEVELS.some((t) => hay.includes(t))) return true;
  const beginner = ["beginner", "new to", "novice", "starter", "intro", "foundation"];
  const inter = ["intermediate", "improver", "developing", "mixed"];
  const advanced = ["advanced", "elite", "competitive", "experienced", "expert"];
  if (beginner.some((t) => el.includes(t))) return beginner.some((t) => hay.includes(t)) || hay.includes("beginner");
  if (advanced.some((t) => el.includes(t))) return advanced.some((t) => hay.includes(t));
  if (inter.some((t) => el.includes(t))) return inter.some((t) => hay.includes(t));
  return false;
}

const MOTIVATION_KEYWORDS: Record<string, string[]> = {
  social: ["social", "community", "friends", "meet people", "group", "team"],
  fitness: ["fitness", "fit", "health", "workout", "cardio", "active"],
  competitive: ["competitive", "competition", "league", "tournament", "ranking"],
  fun: ["fun", "enjoyment", "enjoy", "casual", "recreational", "laid back"],
  skill: ["skill", "improve", "learn", "development", "training", "coaching"],
  wellbeing: ["wellbeing", "mental health", "stress", "mindful", "balance", "wellness"],
};

function motivationMatches(userMotivations: string = "", sessionHay: string = ""): boolean {
  const hay = sessionHay.toLowerCase();
  const userM = userMotivations.toLowerCase();
  for (const terms of Object.values(MOTIVATION_KEYWORDS)) {
    const userHasMotiv = terms.some((t) => userM.includes(t));
    const sessionHasIt = terms.some((t) => hay.includes(t));
    if (userHasMotiv && sessionHasIt) return true;
  }
  return false;
}

export function scoreToPercent(raw: number): number {
  if (raw >= 120) return Math.round(80 + Math.min(20, (raw - 120) / 5));
  if (raw >= 90) return Math.round(60 + ((raw - 90) / 30) * 19);
  if (raw >= 60) return Math.round(40 + ((raw - 60) / 30) * 19);
  if (raw >= 40) return Math.round(25 + ((raw - 40) / 20) * 14);
  return Math.round(10 + (raw / 40) * 14);
}

export function matchBadgeClass(pct: number): "match-green" | "match-teal" | "match-amber" | "match-orange" {
  if (pct >= 80) return "match-green";
  if (pct >= 60) return "match-teal";
  if (pct >= 40) return "match-amber";
  return "match-orange";
}

export interface ScoredItem {
  item: Item;
  score: number;
  reasons: string[];
  pct: number;
}

/**
 * Direct port of the real scoreSession(session, user) — reads
 * player.sports (Favourite Activity + Other Activities Interested In
 * combined, same as userSports in the original), player.area (Home
 * Borough), player.level (Experience Level), and the real "Motivations"
 * text the onboarding form collects. Returns null when genderCompat
 * excludes the player, exactly as the original does.
 */
function scoreItem(item: Item, player: Player, motivationsText: string): { score: number; reasons: string[] } | null {
  let score = 0;
  const reasons: string[] = [];

  const activity = item.type; // real "Activity Type" column for this category
  const className = item.name; // real "Class Name" column
  const location = item.location;
  const vibe = item.vibe;
  const notes = item.description;
  const difficulty = item.difficulty; // real Activities field, NOT item.skillLevel (blank for this category — see file header)
  const totalPrice = item.price;

  const userSports = [...player.sports, ...player.interests].filter(Boolean);
  const homeBorough = player.area;
  const expLevel = player.level;
  const userGender = player.gender ?? "";

  const gResult = genderCompat(item.audience, userGender);
  if (gResult === "excluded") return null;

  const hasSportPref = userSports.some((s) => s.trim());
  const sportMatch = sportMatches(activity, className, userSports);
  if (sportMatch) {
    score += 80;
    reasons.push(`${activity || className} session`);
  } else if (hasSportPref) {
    score *= 0.6;
  }

  const userRegion = getRegion(homeBorough);
  const sessionRegion = getRegion(location);
  const boroughMatch = homeBorough !== "" && location.toLowerCase().includes(homeBorough.toLowerCase());
  if (boroughMatch) {
    score += 35;
    reasons.push(`in ${homeBorough}`);
  } else if (userRegion && sessionRegion && userRegion === sessionRegion) {
    score += 25;
    reasons.push(`near ${homeBorough}`);
  }

  if (gResult === "bonus") {
    score += 30;
  }

  const sessionMotiHay = `${vibe} ${notes} ${className}`;
  if (motivationMatches(motivationsText, sessionMotiHay)) {
    score += 25;
  }

  if (expLevel && skillMatches(expLevel, difficulty, className)) {
    score += 25;
    const dl = difficulty || "mixed level";
    reasons.push(`${dl} level`);
  }

  // Session Format Preference isn't read into Item at all (no real
  // column for it on Core Sessions the way the original's own
  // formatPref/typeField/inOut comparison assumes) — omitted rather
  // than guessed at with a field that doesn't exist on this data.

  if (totalPrice !== 0 && totalPrice <= 10) {
    score += 10;
  }

  if (hasSportPref && !sportMatch) {
    score = Math.round(score * 0.6);
  }

  return { score, reasons };
}

const EXCLUDE_STATUSES = ["cancelled", "inactive", "hidden", "draft", "closed"];

function parseSheetDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [m, d, y] = parts;
  const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Fetches Activities, filters to valid/upcoming/non-kids sessions
 * (same real checks as the original's own runApp: excluded statuses,
 * date in the future, isKidsSession), scores every one against the
 * player's real profile, and returns the top 10 sorted by score —
 * same shape as the original's `top10 = scored.slice(0, 10)`.
 *
 * motivationsText is passed in separately rather than read off Player
 * — the real "Motivations" column (NEIGHBOURS (O)) isn't currently
 * part of the Player type (only sports/area/level/gender/age are), so
 * the caller supplies it from wherever it's actually available; for
 * now that's nowhere real yet (see the "For You" page's own note on
 * this), so it's passed as an empty string until Motivations is wired
 * into Player the same way the other profile fields are.
 */
export async function scoreRecommendations(player: Player, motivationsText: string = ""): Promise<ScoredItem[]> {
  const items = await fetchCategoryItems("Activities");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validItems = items.filter((item) => {
    const status = item.sessionStatus.toLowerCase();
    if (EXCLUDE_STATUSES.some((x) => status.includes(x))) return false;
    const dt = parseSheetDate(item.date);
    if (!dt || dt < today) return false;
    if (isKidsSession(item)) return false;
    return true;
  });

  const scored: ScoredItem[] = [];
  for (const item of validItems) {
    const result = scoreItem(item, player, motivationsText);
    if (!result || result.score < 10) continue;
    scored.push({ item, score: result.score, reasons: result.reasons, pct: scoreToPercent(result.score) });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10);
}
