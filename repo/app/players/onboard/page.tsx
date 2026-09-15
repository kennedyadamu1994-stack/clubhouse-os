"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitOnboarding, type OnboardingSubmission } from "@/lib/players/actions";

/**
 * The real onboarding widget, ported into POS (15 Sep — Kennedy: "embed
 * the onboarding code into the POS. Don't open up another link"). This
 * was previously a standalone static HTML page hosted outside this
 * repo, submitting to an external Google Apps Script endpoint; that
 * pipeline was already replaced by submitOnboarding (lib/players/
 * actions.ts) earlier in this project, but the FORM ITSELF still lived
 * externally until now — "Get Started" on POS's own pages pointed out
 * to thenbrh.co.uk rather than to a page inside this app. This is that
 * missing piece: the exact same 13 questions, same validation rules
 * (1-3 motivations, 1+ availability slots, 1+ session formats, the
 * honeypot field), same field names, ported from vanilla HTML/CSS/JS
 * into a real React component using this app's own design tokens
 * (--pink, .btn-pink, var(--surface) etc.) instead of the original
 * widget's hardcoded colours, so it looks native to POS rather than
 * pasted in.
 *
 * Calls submitOnboarding directly as a Server Action — no API route
 * round-trip needed the way the original external-widget plan required
 * (see submitOnboarding's own doc comment: that reasoning predates the
 * form itself moving into this app). On success, redirects straight to
 * /players/[playerToken]/welcome, same destination as before.
 */
const LONDON_BOROUGHS = [
  "Barking and Dagenham", "Barnet", "Bexley", "Brent", "Bromley", "Camden", "Croydon",
  "Ealing", "Enfield", "Greenwich", "Hackney", "Hammersmith and Fulham", "Haringey",
  "Harrow", "Havering", "Hillingdon", "Hounslow", "Islington", "Kensington and Chelsea",
  "Kingston upon Thames", "Lambeth", "Lewisham", "Merton", "Newham", "Redbridge",
  "Richmond upon Thames", "Southwark", "Sutton", "Tower Hamlets", "Waltham Forest",
  "Wandsworth", "Westminster",
];

const ACTIVITIES = [
  "American Football", "Athletics", "Badminton", "Baseball", "Basketball", "Boxing",
  "Climbing", "Cricket", "Cycling", "Dance", "Equestrian", "Esports", "Football", "Golf",
  "Gymnastics", "Handball", "Ice Hockey", "Lacrosse", "Mixed Martial Arts (MMA)", "Netball",
  "Other", "Padel", "Pilates", "Rowing", "Rugby", "Running", "Sailing", "Skateboarding",
  "Spin", "Squash", "Surfing", "Swimming", "Table Tennis", "Tennis", "Volleyball",
  "Weightlifting", "Wrestling", "Yoga",
];

const MOTIVATIONS = [
  "Meet New People", "Try Something New", "Stay Fit/Lose Weight", "Learn A New Skill",
  "Have Fun", "Train", "Compete",
];

const AVAILABILITY_SLOTS = [
  "Weekday mornings (before 12pm)", "Weekday afternoons (12pm-5pm)", "Weekday evenings (after 5pm)",
  "Weekend mornings (before 12pm)", "Weekend afternoons (12pm-5pm)", "Weekend evenings (after 5pm)",
];

const SESSION_FORMATS = ["Drop In Session", "Training Session", "Competitive League", "Courses/Programmes", "Events/Tournaments"];

const TOTAL_STEPS = 13;

interface FormState {
  name: string;
  email: string;
  phone: string;
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
  participatingClubs: string;
  marketingConsent: boolean;
  website: string; // honeypot
}

const EMPTY_FORM: FormState = {
  name: "", email: "", phone: "", homeBorough: "", dateOfBirth: "", gender: "",
  disabilityStatus: "", favouriteActivity: "", experienceLevel: "", yearsPlayingSport: "",
  motivations: [], availability: [], sessionFormatPreference: [], otherActivitiesInterestedIn: [],
  participatingClubs: "", marketingConsent: false, website: "",
};

function toggleInList(list: string[], value: string, max?: number): string[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (max && list.length >= max) return list;
  return [...list, value];
}

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function isStepValid(): boolean {
    switch (step) {
      case 0: return form.name.trim().length > 0;
      case 1: return /\S+@\S+\.\S+/.test(form.email);
      case 2: return true; // phone optional
      case 3: return form.homeBorough !== "";
      case 4: return form.dateOfBirth !== "" && form.gender !== "" && form.disabilityStatus !== "";
      case 5: return form.favouriteActivity !== "";
      case 6: return form.experienceLevel !== "" && form.yearsPlayingSport !== "";
      case 7: return form.motivations.length >= 1 && form.motivations.length <= 3;
      case 8: return form.availability.length >= 1;
      case 9: return form.sessionFormatPreference.length >= 1;
      case 10: return true; // other interests optional
      case 11: return true; // participating clubs optional
      case 12: return true; // consent is optional to check, submission itself is the gate
      default: return true;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const submission: OnboardingSubmission = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      homeBorough: form.homeBorough,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      disabilityStatus: form.disabilityStatus,
      favouriteActivity: form.favouriteActivity,
      experienceLevel: form.experienceLevel,
      yearsPlayingSport: form.yearsPlayingSport,
      motivations: form.motivations,
      availability: form.availability,
      sessionFormatPreference: form.sessionFormatPreference,
      otherActivitiesInterestedIn: form.otherActivitiesInterestedIn,
      participatingClubs: form.participatingClubs || undefined,
      marketingConsent: form.marketingConsent,
      website: form.website || undefined,
    };
    const result = await submitOnboarding(submission);
    if (!result.ok) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }
    router.push(`/players/${result.playerToken}/welcome`);
  }

  const progressPct = Math.round(((step + 1) / TOTAL_STEPS) * 100);

  return (
    <div className="card outreach-card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="onboard-progress-bar">
        <div className="onboard-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="onboard-progress-text">{progressPct}% complete</p>

      {/* Honeypot — invisible to a real person, never touched by a real player. */}
      <input
        type="text"
        value={form.website}
        onChange={(e) => update("website", e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
        aria-hidden="true"
      />

      {step === 0 && (
        <Step number={1} title="What's your name?">
          <div className="onboard-field">
            <input
              type="text"
              className="onboard-input"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              autoFocus
            />
          </div>
        </Step>
      )}

      {step === 1 && (
        <Step number={2} title="What's your email address?">
          <div className="onboard-field">
            <input
              type="email"
              className="onboard-input"
              placeholder="your.email@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              autoFocus
            />
          </div>
        </Step>
      )}

      {step === 2 && (
        <Step number={3} title="What's your phone number?">
          <div className="onboard-field">
            <input
              type="tel"
              className="onboard-input"
              placeholder="+44 7XXX XXXXXX"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              autoFocus
            />
          </div>
        </Step>
      )}

      {step === 3 && (
        <Step number={4} title="Which borough do you live in?">
          <div className="onboard-field">
            <select
              className="onboard-select"
              value={form.homeBorough}
              onChange={(e) => update("homeBorough", e.target.value)}
            >
              <option value="">Please select...</option>
              {LONDON_BOROUGHS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </Step>
      )}

      {step === 4 && (
        <Step number={5} title="Tell us a bit about yourself">
          <div className="onboard-field">
            <label className="onboard-field-label">What&apos;s your date of birth?</label>
            <input
              type="date"
              className="onboard-input"
              value={form.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
            />
          </div>
          <div className="onboard-field">
            <label className="onboard-field-label">Gender</label>
            <select className="onboard-select" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="">Please select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div className="onboard-field">
            <label className="onboard-field-label">Do you have a disability?</label>
            <div className="onboard-radio-group">
              {["Yes", "No", "Prefer not to say"].map((v) => (
                <label key={v} className={`onboard-option ${form.disabilityStatus === v ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="disabilityStatus"
                    checked={form.disabilityStatus === v}
                    onChange={() => update("disabilityStatus", v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>
        </Step>
      )}

      {step === 5 && (
        <Step number={6} title="What's your favourite activity?">
          <div className="onboard-field">
            <select
              className="onboard-select"
              value={form.favouriteActivity}
              onChange={(e) => update("favouriteActivity", e.target.value)}
            >
              <option value="">Please select...</option>
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </Step>
      )}

      {step === 6 && (
        <Step number={7} title="Tell us about your experience">
          <div className="onboard-field">
            <label className="onboard-field-label">How experienced are you in your favourite activity?</label>
            <div className="onboard-radio-group">
              {["Beginner", "Intermediate", "Advanced", "Expert"].map((v) => (
                <label key={v} className={`onboard-option ${form.experienceLevel === v ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="experienceLevel"
                    checked={form.experienceLevel === v}
                    onChange={() => update("experienceLevel", v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>
          <div className="onboard-field">
            <label className="onboard-field-label">How many years have you been doing this activity?</label>
            <input
              type="number"
              className="onboard-input"
              placeholder="5"
              min={0}
              max={100}
              value={form.yearsPlayingSport}
              onChange={(e) => update("yearsPlayingSport", e.target.value)}
            />
          </div>
        </Step>
      )}

      {step === 7 && (
        <Step number={8} title="What are your main goals for participating?">
          <p className="onboard-instruction">Select up to 3 that matter most to you</p>
          <div className="onboard-checkbox-group">
            {MOTIVATIONS.map((v) => (
              <label key={v} className={`onboard-option ${form.motivations.includes(v) ? "selected" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.motivations.includes(v)}
                  onChange={() => update("motivations", toggleInList(form.motivations, v, 3))}
                />
                {v}
              </label>
            ))}
          </div>
        </Step>
      )}

      {step === 8 && (
        <Step number={9} title="When are you typically available?">
          <p className="onboard-instruction">Select all that apply</p>
          <div className="onboard-checkbox-group">
            {AVAILABILITY_SLOTS.map((v) => (
              <label key={v} className={`onboard-option ${form.availability.includes(v) ? "selected" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.availability.includes(v)}
                  onChange={() => update("availability", toggleInList(form.availability, v))}
                />
                {v}
              </label>
            ))}
          </div>
        </Step>
      )}

      {step === 9 && (
        <Step number={10} title="What type of sessions interest you most?">
          <p className="onboard-instruction">Select all that interest you</p>
          <div className="onboard-checkbox-group">
            {SESSION_FORMATS.map((v) => (
              <label key={v} className={`onboard-option ${form.sessionFormatPreference.includes(v) ? "selected" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.sessionFormatPreference.includes(v)}
                  onChange={() => update("sessionFormatPreference", toggleInList(form.sessionFormatPreference, v))}
                />
                {v}
              </label>
            ))}
          </div>
        </Step>
      )}

      {step === 10 && (
        <Step number={11} title="What other activities are you interested in?">
          <p className="onboard-instruction">Select all activities that interest you (optional)</p>
          <div className="onboard-activity-grid">
            {ACTIVITIES.map((a) => (
              <div
                key={a}
                className={`onboard-activity-box ${form.otherActivitiesInterestedIn.includes(a) ? "selected" : ""}`}
                onClick={() => update("otherActivitiesInterestedIn", toggleInList(form.otherActivitiesInterestedIn, a))}
              >
                {a}
              </div>
            ))}
          </div>
        </Step>
      )}

      {step === 11 && (
        <Step number={12} title="Are there any clubs you're currently involved in?">
          <div className="onboard-field">
            <textarea
              className="onboard-textarea"
              placeholder="Tell us about any clubs you participate in, your role, and how often you attend"
              value={form.participatingClubs}
              onChange={(e) => update("participatingClubs", e.target.value)}
            />
          </div>
        </Step>
      )}

      {step === 12 && (
        <Step number={13} title="Almost there — one last thing">
          <div className="onboard-checkbox-group">
            <label className={`onboard-option ${form.marketingConsent ? "selected" : ""}`}>
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={(e) => update("marketingConsent", e.target.checked)}
              />
              I agree to be contacted about sessions and offers, and consent to my data being stored
            </label>
          </div>
          {submitError && <p className="onboard-error">{submitError}</p>}
        </Step>
      )}

      <div className="onboard-button-group">
        {step > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
            Back
          </button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            className="btn btn-pink"
            disabled={!isStepValid()}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </button>
        ) : (
          <button type="button" className="btn btn-pink" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Submitting…" : "See My Sessions →"}
          </button>
        )}
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="onboard-step-number">Question {number} of {TOTAL_STEPS}</p>
      <h2 className="onboard-step-title">{title}</h2>
      {children}
    </div>
  );
}
