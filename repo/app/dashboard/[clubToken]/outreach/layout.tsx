import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { hasPaidAccess } from "@/lib/types";

const TABS = [
  { slug: "players", label: "Players" },
  { slug: "people", label: "People" },
  { slug: "brands", label: "Brands & Businesses" },
  { slug: "influencers", label: "Influencers" },
  { slug: "sponsorship", label: "Sponsorship & Funding" },
  { slug: "clubs", label: "Clubs" },
];

// Locked on the Free plan (Kennedy's correction, 25 Aug — was originally
// Players/People/Clubs, now swapped): Brands & Businesses, Influencers,
// and Sponsorship & Funding are locked; Players, People, and Clubs stay
// open on Free.
const LOCKED_SLUGS = new Set(["brands", "influencers", "sponsorship"]);

export default async function OutreachLayout({
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

  const [players, people, brands, influencers, sponsorships, directory] = await Promise.all([
    db.getPlayers(),
    db.getPeople(),
    db.getBrands(),
    db.getInfluencers(),
    db.getSponsorships(),
    db.getClubsDirectory(),
  ]);
  const counts: Record<string, number> = {
    players: players.length,
    people: people.length,
    brands: brands.length,
    influencers: influencers.length,
    sponsorship: sponsorships.length,
    clubs: directory.length,
  };

  return (
    <div>
      <nav
        aria-label="Outreach subsections"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}
      >
        {TABS.map((t) => (
          <Link key={t.slug} href={`/dashboard/${clubToken}/outreach/${t.slug}`} className="chip">
            {locked && LOCKED_SLUGS.has(t.slug) && (
              <span aria-hidden style={{ marginRight: 4 }}>
                🔒
              </span>
            )}
            {t.label} <span style={{ color: "var(--faint-text)" }}>({counts[t.slug]})</span>
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
