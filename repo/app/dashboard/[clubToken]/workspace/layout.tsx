import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { SectionTabDropdown } from "@/components/section-tab-dropdown";

const TABS = [
  { slug: "trending", label: "Trending Topics" },
  { slug: "opportunities", label: "Opportunities" },
  { slug: "perks", label: "Perks" },
  { slug: "resources", label: "Resources" },
  { slug: "faq", label: "FAQ" },
];

/**
 * Workspace is fully hidden for Free clubs (Kennedy, 1 Sep — reverses the
 * 27 Aug decision recorded in the comment this replaces, which had
 * removed every paywall so "everything should be accessible" regardless
 * of tier). notFound() here blocks direct URL access too, not just the
 * nav link — Kennedy's explicit call, 1 Sep: "hide nav links AND block
 * direct URL access for hidden sections".
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();
  if (club.plan_tier === "free") notFound();

  const [opportunities, resources, faq, perks, trending] = await Promise.all([
    db.getOpportunities(),
    db.getResources(),
    db.getFaq(),
    db.getPerks(),
    db.getTrendingTopics(),
  ]);
  const counts: Record<string, number> = {
    opportunities: opportunities.filter((o) => o.status === "open").length,
    resources: resources.length,
    faq: faq.length,
    perks: perks.filter((p) => p.active).length,
    trending: trending.length,
  };

  return (
    <div>
      <SectionTabDropdown
        basePath={`/dashboard/${clubToken}/workspace`}
        tabs={TABS.map((t) => ({
          slug: t.slug,
          label: t.label,
          count: counts[t.slug],
        }))}
      />

      {children}
    </div>
  );
}
