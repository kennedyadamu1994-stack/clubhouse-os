import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";

const CATEGORY_LABEL: Record<string, string> = {
  marketing: "Marketing",
  strategy: "Strategy",
  digital: "Digital",
  monetisation: "Monetisation",
};

const FORMAT_LABEL: Record<string, string> = {
  article: "Article",
  video: "Video",
  link: "Link",
  report: "Report",
};

export default async function Resources({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const resources = await db.getResources();
  const base = `/dashboard/${clubToken}`;

  const categories = Array.from(new Set(resources.map((r) => CATEGORY_LABEL[r.category]))).sort();

  const entries: OutreachEntry[] = resources.map((r) => ({
    key: r.resource_id,
    searchText: [r.title, CATEGORY_LABEL[r.category], FORMAT_LABEL[r.format], r.summary].join(" "),
    filterValues: { category: CATEGORY_LABEL[r.category] },
    nameForSort: r.title,
    card: (
      <EntryCard
        key={r.resource_id}
        clubToken={clubToken}
        club_id={club.club_id}
        entryId={r.resource_id}
        initials={FORMAT_LABEL[r.format].slice(0, 2).toUpperCase()}
        title={r.title}
        subtitle={CATEGORY_LABEL[r.category]}
        tags={[FORMAT_LABEL[r.format]]}
        detail={[
          { label: "Category", value: CATEGORY_LABEL[r.category] },
          { label: "Format", value: FORMAT_LABEL[r.format] },
          { label: "Summary", value: r.summary },
        ]}
        actions={[{ action_key: "view_resource", label: "Open", colour: "black", token_cost: 0, href: r.url }]}
        isFirstTokenEncounter={false}
      />
    ),
  }));

  return (
    <div className="card outreach-card">
      <h2>
        Resources <span className="count-badge">{resources.length} available</span>
      </h2>

      {resources.length === 0 ? (
        <EmptyState
          message="No resources listed yet — we're adding more every week."
          cta="Explore the FAQ"
          href={`${base}/workspace/faq`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search resources by title or category…"
          filters={[{ key: "category", label: "Category", values: categories }]}
          sortOptions={[{ key: "name", label: "Name (A–Z)" }]}
        />
      )}
    </div>
  );
}
