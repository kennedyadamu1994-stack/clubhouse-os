import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";

const TABS = [
  { slug: "insights", label: "Insights" },
  { slug: "opportunities", label: "Opportunities" },
  { slug: "resources", label: "Resources" },
  { slug: "faq", label: "FAQ" },
  { slug: "copy-generator", label: "Copy Generator" },
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

  const [opportunities, resources, faq] = await Promise.all([
    db.getOpportunities(),
    db.getResources(),
    db.getFaq(),
  ]);
  const counts: Record<string, number> = {
    opportunities: opportunities.filter((o) => o.status === "open").length,
    resources: resources.length,
    faq: faq.length,
  };

  return (
    <div>
      <nav
        aria-label="Workspace subsections"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}
      >
        {TABS.map((t) => (
          <Link key={t.slug} href={`/dashboard/${clubToken}/workspace/${t.slug}`} className="chip">
            {t.label}
            {t.slug in counts && (
              <span style={{ color: "var(--faint-text)" }}> ({counts[t.slug]})</span>
            )}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
