import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { SectionTabDropdown } from "@/components/section-tab-dropdown";

const TABS = [
  { slug: "players", label: "Players" },
  { slug: "people", label: "People" },
  { slug: "brands", label: "Brands & Businesses" },
  { slug: "influencers", label: "Influencers" },
  { slug: "sponsorship", label: "Sponsorship & Funding" },
  { slug: "clubs", label: "Clubs" },
  { slug: "suppliers", label: "Suppliers" },
  { slug: "social-venues", label: "Social Venues" },
];

/** Subsections Free clubs still see (Kennedy, 1 Sep — reverses the 27 Aug "no paywalls" decision recorded in git history for this file). Every other slug's own page also blocks direct URL access with its own notFound() check, so hiding the tab here and blocking the route there stay in sync deliberately rather than relying on just one of the two. */
const FREE_TAB_SLUGS = new Set(["players", "clubs", "sponsorship"]);

/**
 * Outreach subsection tabs are limited for Free clubs (Kennedy, 1 Sep):
 * only Players, Clubs, and Sponsorship & Funding show in the dropdown —
 * People, Brands & Businesses, Influencers, Suppliers, and Social Venues
 * are hidden entirely, not just paywalled-looking. Each of those 5 pages
 * also has its own notFound() guard, so a Free club can't reach them by
 * URL either.
 */
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

  const isFree = club.plan_tier === "free";
  const visibleTabs = isFree ? TABS.filter((t) => FREE_TAB_SLUGS.has(t.slug)) : TABS;

  const [players, people, brands, influencers, sponsorships, directory, suppliers, socialVenues] = await Promise.all([
    db.getPlayers(),
    db.getPeople(),
    db.getBrands(),
    db.getInfluencers(),
    db.getSponsorships(),
    db.getClubsDirectory(),
    db.getSuppliers(),
    db.getSocialVenues(),
  ]);
  const counts: Record<string, number> = {
    players: players.length,
    people: people.length,
    brands: brands.length,
    influencers: influencers.length,
    sponsorship: sponsorships.length,
    clubs: directory.length,
    suppliers: suppliers.length,
    "social-venues": socialVenues.length,
  };

  return (
    <div>
      <SectionTabDropdown
        basePath={`/dashboard/${clubToken}/outreach`}
        tabs={visibleTabs.map((t) => ({
          slug: t.slug,
          label: t.label,
          count: counts[t.slug],
        }))}
      />

      {children}
    </div>
  );
}
