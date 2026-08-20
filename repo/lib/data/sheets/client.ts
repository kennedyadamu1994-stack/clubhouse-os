import { google } from "googleapis";

/**
 * Auth + raw tab reads for the two real spreadsheets, shared by every
 * entity reader in lib/data/sheets.ts. Split out from that file because
 * every one of the ~20 read methods needs this same client/cache/parse
 * machinery — keeping it here means each entity reader in sheets.ts is
 * just "fetch this tab, map these columns," not repeated auth/caching code.
 *
 * Two spreadsheets, not one (Kennedy, 20 Aug):
 *   - MASTER_SHEET_ID  = "THE ULTIMATE NBRH CLUB HOUSE OS DATABASE"
 *     (DASHBOARD (X), NEIGHBOURS (O), PEOPLE, CONTENT CREATORS, BRANDS,
 *      BUSINESSES, INFLUENCERS, SPONSORSHIPS, FUNDING, OPPORTUNITIES)
 *   - WORKSPACE_SHEET_ID = "CHOS Workspace"
 *     (PLAN, FROM THE NBRH, TRENDING TOPICS, FAQs, PERKS, RESOURCES,
 *      CALENDAR, HEADER, SERVICES)
 * SESSIONS (O), LEAGUES (O), CLUBS (O), VENUES (O), EVENTS (O), and
 * LOGGED TASKS (X) exist in the master sheet but are out of scope — either
 * a different, already-separate sheet is the real source (session data,
 * per Kennedy 20 Aug) or the tab is Kennedy's own private reference with
 * nothing in the app reading it (LOGGED TASKS).
 */

const MASTER_SHEET_ID = process.env.GOOGLE_SHEET_ID_MASTER;
const WORKSPACE_SHEET_ID = process.env.GOOGLE_SHEET_ID_WORKSPACE;

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY — set both in Vercel env vars.",
    );
  }
  // Vercel's env var UI can turn literal \n into a real newline OR leave it
  // as the two-character escape depending on how it was pasted — normalise
  // both cases rather than assuming one. This is the single most common
  // real-world failure point for this kind of credential (flagged to
  // Kennedy when the credentials were first set up).
  const privateKey = key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null;
function getClient() {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4", auth: getAuth() });
  }
  return sheetsClient;
}

export type SheetSource = "master" | "workspace";

function sheetIdFor(source: SheetSource): string {
  const id = source === "master" ? MASTER_SHEET_ID : WORKSPACE_SHEET_ID;
  if (!id) {
    throw new Error(
      `Missing ${source === "master" ? "GOOGLE_SHEET_ID_MASTER" : "GOOGLE_SHEET_ID_WORKSPACE"} env var.`,
    );
  }
  return id;
}

/**
 * In-memory cache, per server instance. Vercel serverless functions are
 * ephemeral (same reason the old local-JSON ledger adapter had to move to
 * Postgres — CLAUDE.md rule 10's failure history), so this is a
 * best-effort warm-cache within one instance's lifetime, not a durable
 * cache — every cold start refetches. 5 minutes matches architecture.md's
 * original ~300s target for reference data.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { rows: string[][]; fetchedAt: number }>();

let latestFetchAt = 0;

/**
 * Reads one tab's full used range as raw string rows (row 0 = headers).
 * Cached per (source, tab) for CACHE_TTL_MS. On a transient API failure,
 * serves a stale cached copy rather than throwing — architecture.md
 * § Failure: "never a raw crash on a Sheets API error." Only throws if
 * there's no cached copy at all to fall back to (first-ever cold read).
 */
export async function readTab(source: SheetSource, tabName: string): Promise<string[][]> {
  const cacheKey = `${source}:${tabName}`;
  const cached = cache.get(cacheKey);
  const isFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
  if (isFresh) return cached.rows;

  try {
    const client = getClient();
    const res = await client.spreadsheets.values.get({
      spreadsheetId: sheetIdFor(source),
      range: tabName,
    });
    const rows = res.data.values ?? [];
    cache.set(cacheKey, { rows, fetchedAt: Date.now() });
    latestFetchAt = Date.now();
    return rows;
  } catch (err) {
    if (cached) return cached.rows; // stale-but-served, per architecture.md § Failure
    throw err;
  }
}

/** Most recent successful fetch across any tab — powers dataAsOf(). */
export function getLatestFetchAt(): number {
  return latestFetchAt;
}

/**
 * Turns raw rows (header row + data rows) into objects keyed by header
 * text, trimmed. Every cell comes back a string or undefined — callers are
 * responsible for parsing numbers/booleans/arrays themselves (see parse.ts)
 * since what "empty" or "yes" means differs per column.
 */
export function rowsToObjects(rows: string[][]): Record<string, string | undefined>[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const obj: Record<string, string | undefined> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i]?.trim() || undefined;
    });
    return obj;
  }).filter((obj) => Object.values(obj).some((v) => v !== undefined)); // skip fully-blank rows
}
