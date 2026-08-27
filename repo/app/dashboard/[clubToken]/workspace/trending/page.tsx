import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { TrendingBoard } from "@/components/trending-board";
import { EmptyState } from "@/components/empty-state";

const CATEGORY_LABEL: Record<string, string> = {
  funding: "Funding",
  grassroots: "Grassroots",
  marketing: "Marketing",
  policy: "Policy",
  community: "Community",
  digital: "Digital",
};

export default async function Trending({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const topics = await db.getTrendingTopics();
  const base = `/dashboard/${clubToken}`;

  return (
    <div className="card outreach-card">
      <h2>
        Trending Topics <span className="count-badge">{topics.length} this week</span>
      </h2>
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginTop: -8, marginBottom: 20, maxWidth: "58ch" }}>
        News and articles worth your attention, picked and framed for what your club is working on.
        Sort and filter to find what's relevant fastest — eventually this list pulls live from a
        shared sheet; for now it's a working preview.
      </p>

      {topics.length === 0 ? (
        <EmptyState
          message="No stories this week — check back soon."
          cta="Explore Resources"
          href={`${base}/workspace/resources`}
        />
      ) : (
        <TrendingBoard topics={topics} categoryLabels={CATEGORY_LABEL} />
      )}
    </div>
  );
}
