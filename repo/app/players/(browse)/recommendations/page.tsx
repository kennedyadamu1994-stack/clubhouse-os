import { EmptyState } from "@/components/empty-state";

/**
 * Public Recommendations (15 Sep — Kennedy: "the Recommendations
 * should be visible here too," reversing the earlier decision to hide
 * this section entirely from the nav without a token). Recommendations
 * genuinely can't compute a real match without a player profile
 * (buildRecommendations, lib/players/recommendations.ts, requires a
 * real Player) — there's no generic/popular fallback list, since
 * Kennedy confirmed (15 Sep) the section should stay visible but
 * prompt someone to get started, not show non-personalised content.
 *
 * The token'd version (app/players/[playerToken]/recommendations/
 * page.tsx) does the real matching; this page is the honest empty
 * state for everyone else.
 */
export default function PublicRecommendations() {
  return (
    <div className="card outreach-card">
      <h2>Recommendations</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        Activities, clubs, leagues, and events matched to your own profile.
      </p>
      <EmptyState
        message="Recommendations are personal to you — get started to build your profile and see real matches."
        cta="Get Started"
        href="https://thenbrh.co.uk"
      />
    </div>
  );
}
