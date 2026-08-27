import type { ClubHealth } from "@/lib/types";

const HEALTH_LABELS: { key: keyof ClubHealth; label: string; description: string }[] = [
  {
    key: "awareness",
    label: "Awareness",
    description:
      "How visible your club is to people nearby who might want to join or support you. Higher scores mean more local players and businesses have actually heard of you.",
  },
  {
    key: "user_reviews",
    label: "User Reviews",
    description:
      "What players, parents, and partners are saying about their experience with your club. This reflects real feedback, not just how many people you reach.",
  },
  {
    key: "nbrh_quality",
    label: "NBRH Quality",
    description:
      "How complete and well-maintained your club's profile and data are on The NBRH. A higher score means clubs, sponsors, and players get an accurate picture of you.",
  },
  {
    key: "management",
    label: "Management",
    description:
      "How consistently your club runs day-to-day — things like session regularity, communication, and admin follow-through. This is about reliability, not size.",
  },
  {
    key: "digital_infrastructure",
    label: "Digital Infrastructure",
    description:
      "How well set up your club is online — a working booking system, an active social presence, a usable website. This is the groundwork everything else builds on.",
  },
];

/**
 * Score-band colour for a Club Health bar/stat — genuinely a status scale
 * (good/needs attention/struggling), so it now uses the semantic tokens
 * directly (27 Aug) rather than a bare hex pair plus var(--pink) standing
 * in for "mid-tier" — pink is the brand colour, not a status colour, so
 * reusing it here conflated "click here" energy with "this needs work."
 */
function tierColor(score: number): string {
  if (score >= 70) return "var(--success)";
  if (score >= 40) return "var(--warning)";
  return "var(--danger)";
}

/**
 * Club Health — replaces the old "Profile completeness" box entirely
 * (Kennedy's request, 20 Aug). Five real values from DASHBOARD (X)'s
 * CHP1-5 columns (Awareness/User Reviews/NBRH Quality/Management/
 * Dig-Infra, columns AD-AH) rather than a single computed completeness
 * percentage.
 *
 * Layout redesigned (Kennedy's follow-up, 20 Aug: the side-by-side
 * layout left the box mostly empty on desktop, screenshot showed a huge
 * dead area below a narrow content strip). Now stacked: the overall score
 * sits large and centred up top, spanning the full card width, with the
 * five bars stretched beneath it — the whole box's real estate is used,
 * not just a corner of it.
 *
 * Descriptions added (Kennedy's request, 25 Aug) — fixed, same-for-every-club
 * explanatory copy, not per-club custom text from the sheet (confirmed
 * explicitly). Kennedy wrote none himself, so this copy is my best attempt
 * at what each category plausibly measures based on its name — worth a
 * read-through and edit before this goes live, since I'm inferring intent
 * here, not reproducing something Kennedy actually specified per category.
 */
export function ClubHealthCard({ health }: { health: ClubHealth }) {
  const overall = Math.round(
    (health.awareness + health.user_reviews + health.nbrh_quality + health.management + health.digital_infrastructure) / 5,
  );

  return (
    <div className="club-health">
      <div className="club-health-overall">
        <div className="club-health-overall-stat" style={{ color: tierColor(overall) }}>
          {overall}%
        </div>
        <p className="stat-label">Overall club health</p>
      </div>
      <div className="club-health-bars">
        {HEALTH_LABELS.map(({ key, label, description }) => {
          const value = health[key];
          return (
            <div className="club-health-item" key={key}>
              <div className="club-health-row">
                <span className="club-health-label">{label}</span>
                <div className="club-health-track">
                  <div
                    className="club-health-fill"
                    style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: tierColor(value) }}
                  />
                </div>
                <span className="club-health-value">{value}%</span>
              </div>
              <p className="club-health-description">{description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
