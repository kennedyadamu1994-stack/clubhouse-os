import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { hasPaidAccess } from "@/lib/types";
import { PaywallGate } from "@/components/paywall-gate";
import { SectionTabDropdown } from "@/components/section-tab-dropdown";

const TABS = [
  { slug: "trending", label: "Trending Topics" },
  { slug: "opportunities", label: "Opportunities" },
  { slug: "perks", label: "Perks" },
  { slug: "resources", label: "Resources" },
  { slug: "faq", label: "FAQ" },
];

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

  const locked = !hasPaidAccess(club.plan_tier);

  // Free clubs still see the tab nav (with a padlock, Kennedy's request,
  // 25 Aug) so the section is visibly there, just gated — never hidden
  // entirely. Counts are skipped for locked clubs since fetching every
  // Workspace data source just to show a number behind a lock isn't worth
  // the extra reads.
  const counts: Record<string, number> = {};
  if (!locked) {
    const [opportunities, resources, faq, perks, trending] = await Promise.all([
      db.getOpportunities(),
      db.getResources(),
      db.getFaq(),
      db.getPerks(),
      db.getTrendingTopics(),
    ]);
    counts.opportunities = opportunities.filter((o) => o.status === "open").length;
    counts.resources = resources.length;
    counts.faq = faq.length;
    counts.perks = perks.filter((p) => p.active).length;
    counts.trending = trending.length;
  }

  return (
    <div>
      <SectionTabDropdown
        basePath={`/dashboard/${clubToken}/workspace`}
        tabs={TABS.map((t) => ({
          slug: t.slug,
          label: t.label,
          count: t.slug in counts ? counts[t.slug] : undefined,
          locked,
        }))}
      />

      {locked ? <PaywallGate sectionName="Workspace" plans={await db.getPlans()} /> : children}
    </div>
  );
}
