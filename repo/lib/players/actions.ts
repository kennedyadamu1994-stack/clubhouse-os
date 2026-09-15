"use server";

import { appendRowByHeaderName, generatePlayerToken } from "@/lib/data/sheets/client";
import { sanitizeForSheet } from "@/lib/sheet-sanitize";

/**
 * POS onboarding submission (15 Sep) — replaces the onboarding widget's
 * old form action, which POSTed directly to a standalone Google Apps
 * Script Web App endpoint outside this repo. That pipeline is now this
 * Server Action: it writes the player's row into the real NEIGHBOURS
 * (O) tab (master sheet, the same tab getPlayers() already reads),
 * generates their private token, and returns it so the widget can
 * redirect straight to /players/[playerToken]/welcome.
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
 * Field → real NEIGHBOURS (O) column mapping matches the onboarding
 * widget's own form `name` attributes exactly, and matches every
 * column name rowToPlayer() (lib/data/sheets.ts) already reads back —
 * Home Borough, Favourite Activity, Other Activities Interested In,
 * Availability, Experience Level, Name, Gender all confirmed identical
 * on both the read and write side.
 *
 * Deliberately does NOT write "Age" — the real NEIGHBOURS (O) sheet has
 * an "Age" column that rowToPlayer() reads, but the onboarding form
 * only collects Date of Birth, never a plain age number. Left for
 * Kennedy to confirm: either a formula column on the real sheet derives
 * Age from Date of Birth automatically (in which case this is correct
 * as-is), or Age is simply blank for every player from this pipeline
 * until that's resolved — either way, guessing an age calculation here
 * risks writing a wrong value into a real data column silently.
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
    await appendRowByHeaderName("master", "NEIGHBOURS (O)", {
      "record_id": playerToken, // player's own token doubles as their record_id — see generatePlayerToken's doc comment on why it's never derived from their name
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
