import type { ClubHealth } from "@/lib/types";

const HEALTH_LABELS: { key: keyof ClubHealth; label: string }[] = [
  { key: "awareness", label: "Awareness" },
  { key: "user_reviews", label: "User Reviews" },
  { key: "nbrh_quality", label: "NBRH Quality" },
  { key: "management", label: "Management" },
  { key: "digital_infrastructure", label: "Digital Infrastructure" },
];

function tierColor(score: number): string {
  if (score >= 70) return "#3D8F6E";
  if (score >= 40) return "var(--pink)";
  return "#C4623A";
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
        {HEALTH_LABELS.map(({ key, label }) => {
          const value = health[key];
          return (
            <div className="club-health-row" key={key}>
              <span className="club-health-label">{label}</span>
              <div className="club-health-track">
                <div
                  className="club-health-fill"
                  style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: tierColor(value) }}
                />
              </div>
              <span className="club-health-value">{value}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
