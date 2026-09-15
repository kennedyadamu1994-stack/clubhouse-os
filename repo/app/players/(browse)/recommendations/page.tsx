import { EmptyState } from "@/components/empty-state";

/**
 * "For You" (displayed label; internal file/route naming stays
 * "recommendations" — Kennedy's 15 Sep rename was display-copy only).
 * Kennedy: "the Recommendations should be visible here too," reversing
 * the earlier decision to hide this section entirely from the nav
 * without a token. Genuinely can't compute a real match without a
 * player profile (buildRecommendations, lib/players/recommendations.ts,
 * requires a real Player) — there's no generic/popular fallback list,
 * since Kennedy confirmed the section should stay visible but prompt
 * someone to get started, not show non-personalised content.
 *
 * The token'd version (app/players/[playerToken]/recommendations/
 * page.tsx) does the real matching; this page is the honest empty
 * state for everyone else.
 *
 * "Get Started" now goes to /players/onboard (15 Sep, Kennedy: "embed
 * the onboarding code into the POS. Don't open up another link") — the
 * real onboarding widget, ported into this app, not an external
 * thenbrh.co.uk placeholder.
 */
export default function PublicRecommendations() {
  return (
    <div className="card outreach-card">
      <h2>For You</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        Activities, clubs, leagues, and events matched to your own profile.
      </p>
      <EmptyState
        message="Recommendations are personal to you — get started to build your profile and see real matches."
        cta="Get Started"
        href="/players/onboard"
      />
    </div>
  );
}
