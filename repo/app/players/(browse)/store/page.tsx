import { EmptyState } from "@/components/empty-state";

/**
 * Club Store — placeholder (15 Sep, Kennedy: "add a Club store page to
 * the drop down - I'll add the link later. For the POS."). Same honest
 * empty-state approach as Guide — no real content/link given yet.
 */
export default function PublicStore() {
  return (
    <div className="card outreach-card">
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "58ch" }}>
        Kit, merchandise, and club gear from The NBRH.
      </p>
      <EmptyState message="The Club Store is coming soon." cta="Back to Home" href="/players" />
    </div>
  );
}
