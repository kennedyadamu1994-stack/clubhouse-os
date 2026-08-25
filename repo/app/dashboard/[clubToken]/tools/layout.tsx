import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { hasPaidAccess } from "@/lib/types";
import { PaywallGate } from "@/components/paywall-gate";

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
      <nav
        aria-label="Tools subsections"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}
      >
        {TABS.map((t) => (
          <Link key={t.slug} href={`/dashboard/${clubToken}/tools/${t.slug}`} className="chip">
            {locked && (
              <span aria-hidden style={{ marginRight: 4 }}>
                🔒
              </span>
            )}
            {t.label}
          </Link>
        ))}
      </nav>

      {locked ? <PaywallGate sectionName="Tools" plans={await db.getPlans()} /> : children}
    </div>
  );
}
