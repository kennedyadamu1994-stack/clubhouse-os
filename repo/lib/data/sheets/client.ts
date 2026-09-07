import { google } from "googleapis";
import { randomAlphanumeric } from "@/lib/auth/random-string";

/**
 * Generates a genuinely random club token (5 Sep security fix) — Node's
 * built-in crypto module, not Math.random(), which is not
 * cryptographically secure and must never be used for anything that
 * functions as an access credential. 24 random base62 characters after
 * the prefix gives well over 140 bits of entropy, making the token
 * infeasible to guess or brute-force, unlike the sequential/predictable
 * Club ID values (e.g. "club_a") this replaces as the real access
 * control mechanism.
 */
export function generateClubToken(prefix: string): string {
  const suffix = randomAlphanumeric(24);
  const cleanPrefix = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  return `${cleanPrefix || "club"}-${suffix}`;
}

/**
 * Auth + raw tab reads for the three real spreadsheets, shared by every
 * entity reader in lib/data/sheets.ts. Split out from that file because
 * every one of the ~20 read methods needs this same client/cache/parse
 * machinery — keeping it here means each entity reader in sheets.ts is
 * just "fetch this tab, map these columns," not repeated auth/caching code.
 *
 * Three spreadsheets (Kennedy, 20 Aug adds "Club Hub" to the original two):
 *   - MASTER_SHEET_ID  = "THE ULTIMATE NBRH CLUB HOUSE OS DATABASE"
 *     (DASHBOARD (X), NEIGHBOURS (O), PEOPLE, CONTENT CREATORS, BRANDS,
 *      BUSINESSES, INFLUENCERS, SPONSORSHIPS, FUNDING, OPPORTUNITIES)
 *   - WORKSPACE_SHEET_ID = "CHOS Workspace"
 *     (PLAN, FROM THE NBRH, TRENDING TOPICS, FAQs, PERKS, RESOURCES,
 *      CALENDAR, HEADER, SERVICES)
 *   - CLUB_HUB_SHEET_ID = "Club Hub" (real ID 1dLYAGkacNmKcSyIoX4p6V9KOansmctifTJwCH-GFLBQ)
 *     — the real source for Outreach → Clubs, replacing the seed-data
 *     fallback. Tab name: "Dynamic Club Page Hub" (Kennedy, 20 Aug).
 * SESSIONS (O), LEAGUES (O), CLUBS (O), VENUES (O), EVENTS (O), and
 * LOGGED TASKS (X) exist in the master sheet but are out of scope — either
 * a different, already-separate sheet is the real source (session data,
 * per Kennedy 20 Aug) or the tab is Kennedy's own private reference with
 * nothing in the app reading it (LOGGED TASKS).
 */

const MASTER_SHEET_ID = process.env.GOOGLE_SHEET_ID_MASTER;
const WORKSPACE_SHEET_ID = process.env.GOOGLE_SHEET_ID_WORKSPACE;
const CLUB_HUB_SHEET_ID = process.env.GOOGLE_SHEET_ID_CLUB_HUB;

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY, set both in Vercel env vars.",
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
    // Was spreadsheets.readonly — widened (27 Aug, notification trigger)
    // since appendRow below needs write access to post a row to the new
    // NOTIFICATIONS tab. Every existing call in this file only ever reads,
    // so this widening changes nothing about current behaviour, it only
    // makes the new write possible.
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null;
function getClient() {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4", auth: getAuth() });
  }
  return sheetsClient;
}

export type SheetSource = "master" | "workspace" | "club_hub";

const SHEET_IDS: Record<SheetSource, string | undefined> = {
  master: MASTER_SHEET_ID,
  workspace: WORKSPACE_SHEET_ID,
  club_hub: CLUB_HUB_SHEET_ID,
};
const SHEET_ENV_VAR_NAMES: Record<SheetSource, string> = {
  master: "GOOGLE_SHEET_ID_MASTER",
  workspace: "GOOGLE_SHEET_ID_WORKSPACE",
  club_hub: "GOOGLE_SHEET_ID_CLUB_HUB",
};

function sheetIdFor(source: SheetSource): string {
  const id = SHEET_IDS[source];
  if (!id) {
    throw new Error(`Missing ${SHEET_ENV_VAR_NAMES[source]} env var.`);
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
 * Rotates one club's login token in place (5 Sep security fix — the real
 * Club ID column previously doubled as the URL token, so it could never
 * be safely randomized; see rowToClub's own doc comment in sheets.ts).
 * Writes to the real "Club Token" column, DASHBOARD (X), master sheet —
 * a NEW column, never the Club ID column itself, so a club's permanent
 * internal ID (their foreign key for balance/actions/inbox history)
 * never changes, only their login link does.
 *
 * Deliberately does NOT swallow errors the way appendRow does — a silent
 * failure here would be actively dangerous: it would look like the
 * rotation succeeded (the old, exposed token would still work) when it
 * hadn't. Every caller must treat a thrown error as "nothing changed,
 * try again," never as a partial or ambiguous success.
 *
 * Finds the target row by matching the real Club ID value against
 * column A, never by row position/index — row order in a live sheet can
 * change (a row inserted or deleted elsewhere), so "row 5" is never a
 * safe way to identify a specific club. Throws if the Club ID isn't
 * found (typo, wrong sheet, already-changed ID) rather than guessing or
 * silently writing to the wrong row — a security fix must never touch a
 * club it can't positively confirm the identity of first.
 */
export async function updateClubToken(clubId: string, newToken: string): Promise<void> {
  const client = getClient();
  const rows = await readTab("master", "DASHBOARD (X)");
  if (rows.length === 0) {
    throw new Error("DASHBOARD (X) came back empty, refusing to write blind.");
  }
  const headerRow = rows[0];
  const clubIdCol = headerRow.indexOf("Club ID");
  const tokenCol = headerRow.indexOf("Club Token");
  if (clubIdCol === -1) {
    throw new Error('DASHBOARD (X) has no "Club ID" column, check the header spelling before retrying.');
  }
  if (tokenCol === -1) {
    throw new Error(
      'DASHBOARD (X) has no "Club Token" column yet, add it to the sheet (any empty column, any position) before rotating tokens.',
    );
  }
  // Data rows start at index 1 (index 0 is the header); +1 to convert
  // back to a real 1-indexed sheet row number for the API call below.
  const rowIndex = rows.slice(1).findIndex((r) => (r[clubIdCol] ?? "").trim() === clubId.trim());
  if (rowIndex === -1) {
    throw new Error(`No row found with Club ID "${clubId}", refusing to guess which row to write to.`);
  }
  const sheetRowNumber = rowIndex + 2; // +1 for the header row, +1 to convert 0-indexed to 1-indexed
  const columnLetter = columnIndexToLetter(tokenCol);
  await client.spreadsheets.values.update({
    spreadsheetId: sheetIdFor("master"),
    range: `DASHBOARD (X)!${columnLetter}${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[newToken]] },
  });
  // Invalidate this tab's cache immediately — without this, the very
  // next read (e.g. confirming the rotation worked) would silently
  // serve the pre-rotation cached data for up to CACHE_TTL_MS, which
  // could look exactly like the write having failed when it didn't.
  cache.delete("master:DASHBOARD (X)");
}

/** A, B, ..., Z, AA, AB, ... — converts a 0-indexed column number into its real spreadsheet column letter(s), for building an exact single-cell range like "C14". */
function columnIndexToLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

/**
 * Appends one row to the end of a tab (27 Aug — Kennedy's email
 * notification loop). Used ONLY by notifyKennedyOfAction() in
 * lib/actions.ts, which writes to the new NOTIFICATIONS tab on the
 * workspace sheet purely to give the already-written Apps Script
 * (apps-script/notify.gs) something real to watch — Actions_Log itself
 * was never wired as a real tab (the real ledger is Postgres, per
 * CLAUDE.md rule 7), so a plain append here is the trigger, not the
 * source of truth for anything the app itself reads back.
 *
 * Deliberately swallows its own errors (logs, doesn't throw) — a failed
 * notification write must never block or fail the actual action, which
 * has already succeeded in Postgres by the time this is called. Losing
 * one notification is a real but acceptable failure mode; losing a
 * club's logged action because Kennedy's email pipeline hiccuped is not.
 */
export async function appendRow(source: SheetSource, tabName: string, row: (string | number)[]): Promise<void> {
  try {
    const client = getClient();
    await client.spreadsheets.values.append({
      spreadsheetId: sheetIdFor(source),
      // Explicitly anchored to A1:E1 rather than just the tab name — a
      // bare tab-name range lets the Sheets API auto-detect where the
      // "table" starts from whatever content already exists on the
      // sheet, and it detected column F (the lone "sent" header
      // Apps Script writes there) as the start, silently shifting every
      // appended row one column right of where notify.gs reads from.
      // Real bug found 28 Aug: rows landed in F–J instead of A–E.
      range: `${tabName}!A1:E1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
  } catch (err) {
    console.error(`appendRow failed for ${source}:${tabName}`, err);
  }
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
