import { ForYouView } from "@/components/for-you-view";

/**
 * "For You" (displayed label; internal file/route naming stays
 * "recommendations" — Kennedy's 15 Sep rename was display-copy only).
 *
 * REWRITTEN (15 Sep) — the earlier version showed a static "get
 * started" prompt for anyone without a player token, since the old
 * scoring engine (buildRecommendations, now removed) required a real
 * Player looked up by token. The new email-based login (Kennedy's
 * decision) means this page can now offer real sign-in directly,
 * right here — ForYouView (components/for-you-view.tsx) handles both
 * the login screen and, once signed in, the real scored results, all
 * in one component, never navigating anywhere else (Kennedy: "it
 * should not link to the search function, it should reveal in the
 * same window the recommendations list"). Identical on both the
 * public and personal Search trees, since the identity here is the
 * email session, not whichever URL happens to be open.
 */
export default function PublicRecommendations() {
  return (
    <div className="card outreach-card">
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        Activities matched to your own profile, scored the same way the real recommendations engine does.
      </p>
      <ForYouView />
    </div>
  );
}
