/**
 * True when `created_at` (an ISO date string, e.g. "2026-08-06") falls
 * within the last 7 days of `now`. Used for every Outreach subsection's
 * "New" badge — a real check against real data, not a hand-picked flag.
 */
export function isRecent(created_at: string, now: Date = new Date()): boolean {
  const created = new Date(created_at);
  if (isNaN(created.getTime())) return false;
  const msSinceCreated = now.getTime() - created.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return msSinceCreated >= 0 && msSinceCreated <= sevenDaysMs;
}
