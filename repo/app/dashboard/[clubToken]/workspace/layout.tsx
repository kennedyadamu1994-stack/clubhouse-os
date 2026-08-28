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
 * Workspace no longer gates on plan tier (Kennedy's request, 27 Aug
 * fourth follow-up: "completely remove the padlocked and locked
 * elements for the free version... everything should be accessible").
 * Every club now sees real counts and real content regardless of tier —
 * the token system is the only thing that limits what a club can do.
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
