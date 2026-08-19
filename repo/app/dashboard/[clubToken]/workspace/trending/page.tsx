import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { TrendingCard } from "@/components/trending-card";
import { EmptyState } from "@/components/empty-state";

const CATEGORY_LABEL: Record<string, string> = {
  funding: "Funding",
  grassroots: "Grassroots",
  marketing: "Marketing",
  policy: "Policy",
  community: "Community",
  digital: "Digital",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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
      </p>

      {topics.length === 0 ? (
        <EmptyState
          message="No stories this week — check back soon."
          cta="Explore Resources"
          href={`${base}/workspace/resources`}
        />
      ) : (
        <div className="trending-list">
          {topics.map((t) => (
            <TrendingCard
              key={t.topic_id}
              headline={t.headline}
              source={t.source}
              categoryLabel={CATEGORY_LABEL[t.category] ?? t.category}
              publishedLabel={formatDate(t.published_at)}
              summary={t.summary}
              whyItMatters={t.why_it_matters}
              url={t.url}
            />
          ))}
        </div>
      )}
    </div>
  );
}
