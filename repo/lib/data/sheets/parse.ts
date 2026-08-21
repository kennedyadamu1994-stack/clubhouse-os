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

/** Comma/semicolon-separated cell → string[]. A single bare value becomes a one-item array — several real columns (Player's "Favourite Activity", Brand's "Industry/Category") hold one value where the app expects an array; this is the documented, deliberate handling for that gap (20 Aug reconciliation), not a bug. */
export function toList(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
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
