import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { SectionTabDropdown } from "@/components/section-tab-dropdown";

const TABS = [
  { slug: "contact", label: "Contact Us" },
  { slug: "search", label: "Search" },
  { slug: "map", label: "Map" },
  { slug: "calendar", label: "Calendar" },
  { slug: "insights", label: "What's happening" },
  { slug: "copy-generator", label: "Copy Generator" },
];

/**
 * Tools is fully hidden for Free clubs (Kennedy, 1 Sep — reverses the 27
 * Aug decision recorded in the comment this replaces, which had removed
 * every paywall so "everything should be accessible" regardless of tier).
 * notFound() here blocks direct URL access too, not just the nav link —
 * Kennedy's explicit call, 1 Sep: "hide nav links AND block direct URL
 * access for hidden sections".
 */
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
  if (club.plan_tier === "free") notFound();

  return (
    <div>
      <SectionTabDropdown
        basePath={`/dashboard/${clubToken}/tools`}
        tabs={TABS.map((t) => ({ slug: t.slug, label: t.label }))}
      />

      {children}
    </div>
  );
}
