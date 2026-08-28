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
 * Tools no longer gates on plan tier (Kennedy's request, 27 Aug fourth
 * follow-up: "completely remove the padlocked and locked elements for
 * the free version... everything should be accessible"). Every club now
 * has access to every tool regardless of tier.
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
