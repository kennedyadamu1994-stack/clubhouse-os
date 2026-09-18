import { EmptyState } from "@/components/empty-state";

/**
 * Guide — placeholder (15 Sep, Kennedy: "add a Guide page to the drop
 * down - I'll add the link later"). No real content/data source given
 * yet, so this is an honest empty state, not invented copy — same
 * approach as every other "link/data coming later" placeholder in this
 * app (e.g. the onboarding widget's own real destination before it was
 * confirmed).
 */
export default function PublicGuide() {
  return (
    <div className="card outreach-card">
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "58ch" }}>
        Everything you need to know about getting started with The NBRH.
      </p>
      <EmptyState message="The Guide is coming soon." cta="Back to Home" href="/players" />
    </div>
  );
}
