import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";

const TABS = [
  { slug: "contact", label: "Contact Us" },
  { slug: "search", label: "Search" },
  { slug: "map", label: "Map" },
  { slug: "calendar", label: "Calendar" },
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

  return (
    <div>
      <nav
        aria-label="Tools subsections"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}
      >
        {TABS.map((t) => (
          <Link key={t.slug} href={`/dashboard/${clubToken}/tools/${t.slug}`} className="chip">
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
