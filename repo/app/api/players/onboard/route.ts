import { NextRequest, NextResponse } from "next/server";
import { submitOnboarding, type OnboardingSubmission } from "@/lib/players/actions";

/**
 * Thin HTTP entry point for the onboarding widget (15 Sep) — the widget
 * is a standalone static HTML page (currently embedded on thenbrh.co.uk),
 * not a page inside this Next.js app, so it can't call submitOnboarding
 * as a Server Action directly; it needs a real URL to POST a form to,
 * same as it POSTs to the Apps Script endpoint today. This route is
 * that URL — it only reshapes the incoming form fields into
 * OnboardingSubmission and calls the real logic in lib/players/actions.ts,
 * which is where the actual validation, sanitisation, and sheet write
 * happen.
 *
 * Accepts the same field names as the widget's existing <form>
 * (multipart/form-data, since that's what a plain HTML form POSTs) —
 * the widget's own JS needs a small update to point its `action` at
 * this route (see the redirect-URL doc comment below), but its field
 * names and hidden inputs (submissionId, submittedAt, source, the
 * "website" honeypot) don't need to change at all.
 *
 * Responds with JSON, not a redirect — the widget's own JS already
 * expects an async response it can read before deciding what to show
 * (its existing success-screen animation, then a client-side redirect,
 * exactly like it already does for the Apps Script response), so this
 * mirrors that rather than forcing an HTTP redirect the widget's script
 * wouldn't be able to intercept the way it currently does.
 */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read the submitted form." }, { status: 400 });
  }

  const one = (key: string) => (form.get(key)?.toString() ?? "").trim();
  const list = (key: string) =>
    one(key)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  const submission: OnboardingSubmission = {
    name: one("Name"),
    email: one("Email"),
    phone: one("Phone"),
    homeBorough: one("Home Borough"),
    dateOfBirth: one("Date of Birth"),
    gender: one("Gender"),
    disabilityStatus: one("Disability Status"),
    favouriteActivity: one("Favourite Activity"),
    experienceLevel: one("Experience Level"),
    yearsPlayingSport: one("Years Playing Sport"),
    motivations: list("Motivations"),
    availability: list("Availability"),
    sessionFormatPreference: list("Session Format Preference"),
    otherActivitiesInterestedIn: list("Other Activities Interested In"),
    participatingClubs: one("Participating Clubs"),
    marketingConsent: one("Marketing Consent").toLowerCase() === "yes",
    website: one("website"), // honeypot
  };

  const result = await submitOnboarding(submission);
  if (!result.ok) {
    return NextResponse.json(result, { status: 422 });
  }
  return NextResponse.json({
    ok: true,
    // The widget's own JS builds the final redirect from this rather
    // than a hardcoded MY_NBRH_URL constant, which is what it currently
    // points at (see the widget's old success-screen script) — this is
    // the one line of its JS that has to change alongside the form
    // action, since the destination is now per-player, not one shared
    // static page.
    redirectUrl: `/players/${result.playerToken}/welcome`,
  });
}
