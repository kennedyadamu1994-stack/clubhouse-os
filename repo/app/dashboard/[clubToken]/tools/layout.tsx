import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { hasPaidAccess } from "@/lib/types";
import { PaywallGate } from "@/components/paywall-gate";
import { SectionTabDropdown } from "@/components/section-tab-dropdown";

const TABS = [
  { slug: "contact", label: "Contact Us" },
  { slug: "search", label: "Search" },
  { slug: "map", label: "Map" },
  { slug: "calendar", label: "Calendar" },
  { slug: "insights", label: "What's happening" },
  { slug: "copy-generator", label: "Copy Generator" },
];

export default async function ToolsLayout({
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

  return (
    <div>
      <SectionTabDropdown
        basePath={`/dashboard/${clubToken}/tools`}
        tabs={TABS.map((t) => ({ slug: t.slug, label: t.label, locked }))}
      />

      {locked ? <PaywallGate sectionName="Tools" plans={await db.getPlans()} /> : children}
    </div>
  );
}
