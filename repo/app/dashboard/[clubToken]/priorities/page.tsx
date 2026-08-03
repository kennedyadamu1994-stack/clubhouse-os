import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdapter } from "@/lib/data";

/**
 * Priorities capture — the v1 stand-in for the club triage tool (D10).
 * Writes Clubs.priorities + goals, which is enough to power match scoring,
 * so the "Set your priorities" empty-state CTA works end-to-end today.
 * When the full triage tool is built, this page becomes its entry point.
 */

const PRIORITY_OPTIONS = [
  "sponsorship",
  "youth development",
  "volunteers",
  "coaching",
  "facilities",
  "media",
  "competitive",
  "casual play",
  "strategy",
];

export default async function Priorities({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  async function save(formData: FormData) {
    "use server";
    const db = getAdapter();
    const club = await db.getClubByToken(clubToken);
    if (!club) notFound();
    const priorities = PRIORITY_OPTIONS.filter((p) => formData.get(`p_${p}`) === "on");
    const goals = String(formData.get("goals") ?? "").slice(0, 500);
    await db.setClubPriorities(club.club_id, priorities, goals);
    revalidatePath(`/dashboard/${clubToken}`);
    redirect(`/dashboard/${clubToken}`);
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h2 style={{ marginBottom: 6 }}>What matters most to your club right now?</h2>
      <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", marginBottom: 20 }}>
        This powers every recommendation you see. Pick as many as apply — you can change them
        any time.
      </p>
      <form action={save}>
        <div className="field">
          <span className="hint" id="priorities-hint">
            Your priorities
          </span>
          <div className="checks" role="group" aria-labelledby="priorities-hint">
            {PRIORITY_OPTIONS.map((p) => (
              <label key={p}>
                <input
                  type="checkbox"
                  name={`p_${p}`}
                  defaultChecked={club.priorities.includes(p)}
                />
                <span style={{ textTransform: "capitalize" }}>{p}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="goals">Your goals in a sentence or two (optional)</label>
          <textarea id="goals" name="goals" rows={3} defaultValue={club.goals} maxLength={500} />
        </div>
        <button className="btn btn-pink" type="submit">
          Save priorities
        </button>
      </form>
    </div>
  );
}
