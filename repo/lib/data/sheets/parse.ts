/**
 * Cell-to-TypeScript-shape parsing helpers, shared across every entity
 * reader in ../sheets.ts. Centralised here because the same conversions
 * (Y/N → boolean, comma-list → string[], several columns → one combined
 * field) recur across many tabs — found repeatedly during the column
 * reconciliation against Kennedy's real sheets (20 Aug).
 */

import type { KpiEntry } from "../../types";

export function toBool(v: string | undefined): boolean {
  if (!v) return false;
  return /^(y|yes|true|1)$/i.test(v.trim());
}

/**
 * Reads a row's sponsored status, checking both real column spellings
 * ("SPONSORED" or "SPONSORED?" — Kennedy confirmed 25 Aug both are used
 * across different tabs, no fixed rule for which). Cells are currently
 * empty everywhere (Kennedy: "I will implement the Y/N in the cells
 * later") so this correctly reads as false today and will pick up real
 * Y/N values the moment they're added, with no code change needed then.
 */
export function readSponsored(row: Record<string, string | undefined>): boolean {
  return toBool(row["SPONSORED"]) || toBool(row["SPONSORED?"]);
}

/** Comma/semicolon-separated cell → string[]. A single bare value becomes a one-item array — several real columns (Player's "Favourite Activity", Brand's "Industry/Category") hold one value where the app expects an array; this is the documented, deliberate handling for that gap (20 Aug reconciliation), not a bug. */
export function toList(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Same idea as toList() but DASH-separated, not comma-separated — the
 * format Kennedy confirmed for DASHBOARD (X)'s new "Tags" column
 * specifically (29 Aug: "Basketball - Female - London"), used ONLY for a
 * club's own tags. Every other tags column in the app (Sponsorships,
 * Opportunities, Suppliers, etc.) already uses commas via toList(), so
 * this is a deliberate second function, not a replacement — using the
 * wrong one on the wrong column would silently misparse either format.
 * Splits on a hyphen surrounded by whitespace (" - ") rather than any
 * bare hyphen, so a tag that itself legitimately contains one (e.g. a
 * hyphenated place name) isn't incorrectly split apart.
 */
export function toDashList(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(/\s+-\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Filters raw tag values down to genuine, matchable text phrases (Kennedy,
 * 29 Aug: "some keywords in there that are ID numbers, URLs or just
 * non-contextual numbers, can these be ignored. Just want the full
 * text/phrases"). Excludes:
 *   - URLs (http/https/www)
 *   - Standalone numbers (e.g. "12345", "2026") with nothing else in the tag
 *   - Reference-code-shaped tokens: 1-4 letters immediately followed by 3+
 *     digits, with no space (e.g. "SP0042", "KIT-118", "ID2026") — this
 *     specific shape (short prefix + a run of 3 or more digits) is what
 *     distinguishes a system-generated code from a real short label.
 *     Confirmed with Kennedy (29 Aug) that shorter alphanumeric labels
 *     like "U18" (1 letter + 2 digits) or "B2B" (digit sandwiched, no
 *     trailing digit run) are genuine category tags, not IDs, and must
 *     be KEPT — the 3+ trailing digit requirement is exactly what keeps
 *     those in while catching real reference codes.
 *   - Whole-sentence/paragraph fragments (30 Aug, real bug found via the
 *     tags-debug route): a malformed source formula on DASHBOARD (X)'s
 *     Tags column was pulling in an ENTIRE club profile — bio text, FAQ
 *     questions and answers, image URLs — dash-joined together, e.g. "We
 *     aim to provide a platform upon which everyone can train and
 *     improve...". toDashList() correctly split this into fragments (it
 *     did its job), but no genuine tag is ever a full sentence — capped
 *     at MAX_TAG_WORDS words AND MAX_TAG_CHARS characters, whichever is
 *     hit first; both real short-phrase examples throughout this file
 *     ("5-a-side football", "under 12s", "Female Students") sit well
 *     under both limits, so this is a large, deliberately generous
 *     margin, not a tight one that risks rejecting real tags.
 * This is the ONE place this filtering happens — every tags reader in
 * sheets.ts below should pass its parsed list through this before storing
 * it, so the exclusion rule can't drift between entity types.
 */
const MAX_TAG_WORDS = 6;
const MAX_TAG_CHARS = 40;

export function filterContextualTags(tags: string[]): string[] {
  const urlPattern = /^(https?:\/\/|www\.)/i;
  const pureNumberPattern = /^\d+$/;
  const referenceCodePattern = /^[a-z]{1,4}-?\d{3,}$/i;

  return tags.filter((tag) => {
    const t = tag.trim();
    if (!t) return false;
    if (urlPattern.test(t)) return false;
    if (pureNumberPattern.test(t)) return false;
    // Reference-code exclusion only applies to single unspaced tokens —
    // a real phrase ("5-a-side football") is never mistaken for a code.
    if (!t.includes(" ") && referenceCodePattern.test(t)) return false;
    if (t.length > MAX_TAG_CHARS) return false;
    if (t.split(/\s+/).length > MAX_TAG_WORDS) return false;
    return true;
  });
}

export function toNumberOrNull(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v.replace(/[£$,\s]/g, ""));
  return Number.isNaN(n) ? null : n;
}

export function toNumber(v: string | undefined, fallback = 0): number {
  const n = toNumberOrNull(v);
  return n ?? fallback;
}

/**
 * Combines DASHBOARD (X)'s five separate "KPI N Name"/"KPI N Value"/
 * "KPI Target N" column trios into structured KpiEntry objects (Kennedy's
 * request, 20 Aug: show the target alongside the current value, "so they
 * can see what they're working towards" — targets confirmed live in
 * columns AR-AV, headers "KPI Target 1" through "KPI Target 5"). Skips any
 * entry where the name is blank.
 */
export function combineKpiPairs(row: Record<string, string | undefined>): KpiEntry[] {
  const kpis: KpiEntry[] = [];
  for (let i = 1; i <= 5; i++) {
    const name = row[`KPI ${i} Name`];
    if (!name) continue;
    kpis.push({
      name,
      value: row[`KPI ${i} Value`] ?? null,
      target: row[`KPI Target ${i}`] ?? null,
    });
  }
  return kpis;
}

/**
 * Combines Calendar's split Day/Month/Year (+ optional Time) columns into
 * one ISO-ish date string, matching the single `date` field Event expects.
 * Falls back to today's date on unparseable input rather than throwing —
 * one bad row in Kennedy's hand-maintained Calendar tab shouldn't break
 * the whole Calendar page (architecture.md § Failure).
 */
export function combineCalendarDate(
  day: string | undefined,
  month: string | undefined,
  year: string | undefined,
  time: string | undefined,
): string {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y || Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) {
    return new Date().toISOString().slice(0, 10);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${y}-${pad(m)}-${pad(d)}`;
  return time ? `${datePart}T${time}` : datePart;
}
