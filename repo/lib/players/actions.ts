"use server";

import { appendRowByHeaderName, generatePlayerToken } from "@/lib/data/sheets/client";
import { sanitizeForSheet } from "@/lib/sheet-sanitize";
import { getAdapter } from "@/lib/data";
import { notifyKennedyOfAction } from "@/lib/actions";
import type { Player } from "@/lib/types";

/**
 * POS onboarding submission (15 Sep) — replaces the onboarding widget's
 * old form action, which POSTed directly to a standalone Google Apps
 * Script Web App endpoint outside this repo. That pipeline is now this
 * Server Action.
 *
 * REWRITTEN (16 Sep) — a serious real bug: this originally wrote
 * straight into NEIGHBOURS (O), the same real tab getPlayers()/
 * getPlayerByToken()/getPlayerByEmail() all read from. NEIGHBOURS (O)
 * is not a source table at all — it's the OUTPUT of a real array
 * formula that pulls from a separate real worksheet, "Onboarding
 * List," on a separate workbook ("Neighbour Database," sheet ID
 * 1b7QxteWsdr7jByJg63f0WvUYz6KIUFYKrQH9ygqeHmg — see the new
 * "neighbour_db" SheetSource, lib/data/sheets/client.ts). Writing a
 * new row directly into a live array-formula range breaks the formula
 * itself, silently wiping every row beneath it — which is exactly what
 * happened: every real signup through this form corrupted NEIGHBOURS
 * (O) and took down every real data read across BOTH CHOS and POS at
 * once (both read this same sheet), with no error anywhere, since the
 * read side was working completely correctly against a sheet that had
 * genuinely gone empty. Confirmed directly with Kennedy (16 Sep) after
 * a long, otherwise inconclusive investigation — every code-level and
 * credential-level check came back clean because the bug was neither;
 * it was a live formula being overwritten by design, not by accident
 * anywhere Vercel/Google Cloud logs would ever have shown as an error.
 *
 * Writes to the real "Onboarding List" tab (neighbour_db source) now,
 * never NEIGHBOURS (O) directly. The array formula on NEIGHBOURS (O)
 * only pulls columns A-U from Onboarding List (Kennedy, 16 Sep) — the
 * rest of NEIGHBOURS (O)'s own columns are filled in by Kennedy
 * manually and this action must never write to NEIGHBOURS (O) at all.
 *
 * record_id (the player's own token) is NOT one of Onboarding List's
 * real A-U columns — on NEIGHBOURS (O) itself, record_id is a separate
 * column Kennedy fills in manually, outside the array formula's pulled
 * range entirely. To keep this fully automated (Kennedy's explicit
 * choice, 16 Sep, over reverting to a manual step), Kennedy is adding a
 * NEW column to Onboarding List, named exactly "record_id" (matching
 * NEIGHBOURS (O)'s own column name), positioned outside A-U so the
 * array formula never touches it — this action writes the generated
 * token there directly. getPlayerByToken/getPlayerByEmail still read
 * from NEIGHBOURS (O) as before (unaffected — those are genuine reads
 * of the real, correct source of truth once the formula pulls
 * everything through), so a new signup's token only resolves correctly
 * once the array formula has actually run and pulled their row through
 * — the same real dependency that already existed for every other
 * field, now true for record_id too.
 *
 * Why this moved in-app rather than extending the Apps Script (Kennedy,
 * 15 Sep, choosing between the two): token generation and row-writing
 * have to happen together, atomically, in code that can actually be
 * tested and debugged — Apps Script is a separate runtime this repo
 * has no visibility into. This also means one deploy pipeline
 * (Vercel, via the existing GitHub Desktop workflow) instead of two.
 * The onboarding widget's HTML page itself doesn't have to move
 * anywhere — only its form's submission target changes, from the Apps
 * Script URL to this action (called via a thin API route, since the
 * widget is a standalone static page, not a Next.js form).
 *
 * Every free-text field is run through sanitizeForSheet — this is the
 * first genuinely public, unauthenticated write surface in the app
 * (every other write requires an existing club token first), so the
 * formula-injection defence that's normally only needed for logged-in
 * clubs' free-text fields is essential here by default.
 *
 * Field → real Onboarding List column mapping matches the onboarding
 * widget's own form `name` attributes exactly.
 *
 * Deliberately does NOT write "Age" — Onboarding List has a real "Age"
 * column (confirmed by Kennedy, 16 Sep), but the onboarding form only
 * collects Date of Birth, never a plain age number. Left unwritten for
 * the same reason as before this rewrite: either a formula column
 * derives Age from Date of Birth automatically, or it's simply blank
 * for every player from this pipeline until that's resolved — either
 * way, guessing an age calculation here risks writing a wrong value
 * into a real data column silently.
 */
export interface OnboardingSubmission {
  name: string;
  email: string;
  phone?: string;
  homeBorough: string;
  dateOfBirth: string;
  gender: string;
  disabilityStatus: string;
  favouriteActivity: string;
  experienceLevel: string;
  yearsPlayingSport: string;
  motivations: string[];
  availability: string[];
  sessionFormatPreference: string[];
  otherActivitiesInterestedIn: string[];
  participatingClubs?: string;
  marketingConsent: boolean;
  /** Honeypot field from the onboarding widget's hidden "website" input — a filled value means a bot, never a real player. */
  website?: string;
}

export type OnboardingResult = { ok: true; playerToken: string } | { ok: false; error: string };

/**
 * POS's email-based login for Favourites/"For You" (15 Sep, Kennedy's
 * decision) — separate identity from the player's own private token
 * link (which stays scoped to onboarding/welcome only). Looks up the
 * real, ungated Player row by email via getPlayerByEmail (lib/data/
 * index.ts) — the same deliberate exception shape as getPlayerByToken
 * already uses, since a player proving they hold their own inbox by
 * typing the email they registered with is the one legitimate
 * non-admin case where a real name/email is returned rather than
 * gatePlayer()'s always-null version.
 *
 * Returns the full Player on success — this is genuinely that specific
 * person's own data, being shown back to them, not exposed to anyone
 * else. The client is responsible for keeping this in memory/
 * localStorage for the length of the session; this action doesn't
 * issue any cookie or server-side session of its own.
 *
 * forceFresh (17 Sep) — passed true only right after a brand-new
 * signup (see the onboarding page's own doc comment for the real race
 * this guards against: NEIGHBOURS (O) may not have propagated the new
 * row through its own array formula yet, and this app's 5-minute
 * Sheets cache could otherwise keep serving a stale pre-signup read
 * for real minutes even once the sheet itself has updated). Every
 * ordinary returning-visitor sign-in leaves this false — forcing a
 * fresh fetch on every normal login would be needlessly slower for the
 * common case where the cache is genuinely fine.
 */
export interface EmailLoginResult {
  ok: boolean;
  player?: Player;
  error?: string;
}

export async function loginByEmail(email: string, forceFresh = false): Promise<EmailLoginResult> {
  const trimmed = email.trim();
  if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  const db = getAdapter();
  const player = await db.getPlayerByEmail(trimmed, forceFresh);
  if (!player) {
    return { ok: false, error: "We couldn't find an account with that email. Make sure you've signed up to The NBRH first." };
  }
  return { ok: true, player };
}

/**
 * Toggles one item's favourited state for a logged-in player (email
 * identity, 15 Sep) — the direct player-side counterpart of
 * toggleFavourite in lib/actions.ts, which is club-scoped. Re-verifies
 * the email resolves to a real player server-side before writing,
 * same ownership-verification principle already used there (never
 * trust a client-supplied identity without checking it against real
 * data first).
 */
export async function togglePlayerFavouriteAction(
  email: string,
  category: string,
  item_id: string,
  title: string,
  subtitle: string,
  href: string,
): Promise<{ saved: boolean; error?: string }> {
  const trimmed = email.trim().toLowerCase();
  const db = getAdapter();
  const player = await db.getPlayerByEmail(trimmed);
  if (!player) {
    return { saved: false, error: "Could not verify this account." };
  }
  return db.togglePlayerFavourite(trimmed, category, item_id, title, subtitle, href);
}

/**
 * Server Action wrapper around getPlayerFavouritedKeys (lib/data/*.ts)
 * — that function itself runs a real Postgres query, which can't run
 * client-side; this is the callable surface a client component (any
 * page rendering a list of PlayerEntryCard/PlayerFavouriteHeart) uses
 * to know which hearts should render filled on first paint, once the
 * email session (usePlayerSession) resolves. Re-verifies the email
 * against a real player first, same as togglePlayerFavouriteAction —
 * an unrecognised email just gets an empty set back rather than an
 * error, since "no favourites yet" and "not logged in" look the same
 * from a card's own point of view.
 */
export async function getPlayerFavouritedKeysAction(email: string): Promise<string[]> {
  const trimmed = email.trim().toLowerCase();
  const db = getAdapter();
  const player = await db.getPlayerByEmail(trimmed);
  if (!player) return [];
  const keys = await db.getPlayerFavouritedKeys(trimmed);
  return Array.from(keys);
}

/**
 * Full favourite rows (title/subtitle/href snapshot, not just the
 * category:item_id keys getPlayerFavouritedKeysAction returns) — used
 * by the Favourites page itself, which needs to actually display each
 * saved item, not just know whether a given card's heart should be
 * filled.
 */
export async function getPlayerFavouritesAction(email: string) {
  const trimmed = email.trim().toLowerCase();
  const db = getAdapter();
  const player = await db.getPlayerByEmail(trimmed);
  if (!player) return [];
  return db.getPlayerFavourites(trimmed);
}

const REQUIRED_STRING_FIELDS: (keyof OnboardingSubmission)[] = [
  "name",
  "email",
  "homeBorough",
  "dateOfBirth",
  "gender",
  "disabilityStatus",
  "favouriteActivity",
  "experienceLevel",
  "yearsPlayingSport",
];

export async function submitOnboarding(submission: OnboardingSubmission): Promise<OnboardingResult> {
  // Honeypot — a real player never fills in a field their browser never shows them.
  // Return a fake success rather than an error, so a bot gets no signal it was caught.
  if (submission.website) {
    return { ok: true, playerToken: generatePlayerToken() };
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!String(submission[field] ?? "").trim()) {
      return { ok: false, error: `Missing required field: ${field}` };
    }
  }
  if (submission.motivations.length < 1 || submission.motivations.length > 3) {
    return { ok: false, error: "Select between 1 and 3 goals." };
  }
  if (submission.availability.length < 1) {
    return { ok: false, error: "Select at least one time slot." };
  }
  if (submission.sessionFormatPreference.length < 1) {
    return { ok: false, error: "Select at least one session type." };
  }

  const playerToken = generatePlayerToken();
  const s = (v: string | undefined) => sanitizeForSheet(v);

  try {
    await appendRowByHeaderName("neighbour_db", "Onboarding List", {
      "record_id": playerToken, // NEW column on Onboarding List (Kennedy adding it, 16 Sep) — outside the array formula's A-U pulled range, so it's never touched by the formula; see this file's own doc comment for the full story
      "Name": s(submission.name),
      "Email": s(submission.email),
      "Phone": s(submission.phone),
      "Home Borough": s(submission.homeBorough),
      "Date of Birth": s(submission.dateOfBirth),
      "Gender": s(submission.gender),
      "Disability Status": s(submission.disabilityStatus),
      "Favourite Activity": s(submission.favouriteActivity),
      "Experience Level": s(submission.experienceLevel),
      "Years Playing Sport": s(submission.yearsPlayingSport),
      "Motivations": s(submission.motivations.join(", ")),
      "Availability": s(submission.availability.join(", ")),
      "Session Format Preference": s(submission.sessionFormatPreference.join(", ")),
      "Other Activities Interested In": s(submission.otherActivitiesInterestedIn.join(", ")),
      "Participating Clubs": s(submission.participatingClubs),
      "Marketing Consent": submission.marketingConsent ? "Yes" : "No",
      "date_added": new Date().toISOString().slice(0, 10),
    });
    return { ok: true, playerToken };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Something went wrong, nothing was saved. Please try again.",
    };
  }
}

/**
 * Server Action wrapper around getNbrhUpdates (lib/data/*.ts) — "From
 * The NBRH" for Home (15 Sep, Kennedy: "add the from the NBRH drop
 * down that can be found in the CHOS... take from the same data
 * source"). getNbrhUpdates itself is already genuinely platform-wide
 * (no club_id argument, real "FROM THE NBRH" tab on the CHOS Workspace
 * workbook), so this is a thin passthrough, not new data logic — the
 * wrapper exists only because Home is a client component and needs a
 * callable Server Action, the same reason every other player.ts export
 * here exists.
 */
export async function getNbrhUpdatesAction() {
  const db = getAdapter();
  return db.getNbrhUpdates();
}

/**
 * Marks one P INBOX message read for a logged-in player, keyed by
 * email — direct equivalent of markInboxRead (lib/actions.ts), which
 * re-verifies the club behind a token before writing rather than
 * trusting a raw club_id from the client. This re-verifies the email
 * against a real player the same way togglePlayerFavouriteAction
 * already does, for the same reason: never trust a client-supplied
 * identity without checking it against real data first.
 */
export async function markPlayerInboxReadAction(email: string, message_id: string): Promise<void> {
  const trimmed = email.trim().toLowerCase();
  const db = getAdapter();
  const player = await db.getPlayerByEmail(trimmed);
  if (!player) return;
  await db.markPlayerInboxMessageRead(trimmed, message_id);
}

/** Server Action wrapper around getUnreadPlayerInboxCount — powers the header icon's unread badge, the same lightweight count-only pattern getUnreadInboxCount already uses for CHOS. */
export async function getUnreadPlayerInboxCountAction(email: string): Promise<number> {
  const trimmed = email.trim().toLowerCase();
  const db = getAdapter();
  const player = await db.getPlayerByEmail(trimmed);
  if (!player) return 0;
  return db.getUnreadPlayerInboxCount(trimmed);
}

/** Server Action wrapper around getPlayerInboxMessages — used by the Inbox page itself. */
export async function getPlayerInboxMessagesAction(email: string) {
  const trimmed = email.trim().toLowerCase();
  const db = getAdapter();
  const player = await db.getPlayerByEmail(trimmed);
  if (!player) return [];
  return db.getPlayerInboxMessages(trimmed);
}

/**
 * Player Contact Us / Request a Feature (15 Sep, Kennedy: "the Contact
 * page in the CHOS, can you add this as an option in the dropdown of
 * the POS. With the contact us & request a feature"). Deliberately NOT
 * a reuse of submitOutreachAction (lib/actions.ts) — that function's
 * real job (Actions_Log ledger, idempotency, token balance) has no
 * player equivalent; this keeps only what genuinely matters here: the
 * same real 5-per-hour rate limit CHOS's own free actions use (against
 * a fully separate table, countRecentPlayerActions/recordPlayerAction
 * — see those methods' own doc comments), and the same real
 * notification to Kennedy via notifyKennedyOfAction, now exported from
 * lib/actions.ts specifically so this can call it directly rather than
 * duplicate the NOTIFICATIONS-tab write logic.
 *
 * Does NOT require a signed-in player session — anyone can use Contact
 * Us / Request a Feature, matching CHOS's own Contact page, which
 * likewise has no login of its own (every real club already has a
 * clubToken by definition just from being on that page). A player's
 * name/email fields are typed in directly on the form, not read from
 * usePlayerSession.
 */
export async function submitPlayerAction(input: {
  name: string;
  email: string;
  action_key: "player_contact_us" | "player_feature_request";
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = input.email.trim();
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!input.message.trim()) {
    return { ok: false, error: "Please enter a message." };
  }

  const db = getAdapter();
  const RATE_LIMIT_WINDOW_MINUTES = 60;
  const RATE_LIMIT_MAX = 5;
  const recentCount = await db.countRecentPlayerActions(email, RATE_LIMIT_WINDOW_MINUTES);
  if (recentCount >= RATE_LIMIT_MAX) {
    return { ok: false, error: "You've submitted a few of these recently, please wait a bit before sending another." };
  }

  await db.recordPlayerAction(email, input.action_key);
  await notifyKennedyOfAction({
    clubName: input.name.trim() ? `${input.name.trim()} (${email})` : email,
    action_key: input.action_key,
    notes: input.message,
  }).catch(() => {});

  return { ok: true };
}
