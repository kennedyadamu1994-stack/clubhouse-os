import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EmptyState } from "@/components/empty-state";
import { FavouriteRowItem } from "@/components/favourite-row-item";

/**
 * Real, human-readable label per stored category — matches the
 * favouriteCategory strings passed into EntryCard across every Outreach
 * page, plus "trending" from TrendingCard. Order here is also the
 * section display order on this page.
 */
const CATEGORY_LABEL: Record<string, string> = {
  player: "Players",
  person: "People",
  brand: "Brands & Businesses",
  influencer: "Influencers",
  club: "Clubs",
  supplier: "Suppliers",
  social_venue: "Social Venues",
  sponsorship: "Sponsorship & Funding",
  trending: "Trending Topics",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL);

/**
 * Favourites (Kennedy's request, 9 Sep: "a heart... saved to the club's
 * individual CHOS page... see all their favourite items saved as a
 * list... sorted into sections"). Linked from the header's hamburger
 * menu (components/header-menu.tsx), not the main sidebar nav — same
 * treatment as Inbox/Membership, a personal per-club page rather than
 * one of the three main sections.
 *
 * Every row shows the snapshot captured at save time (title/subtitle),
 * not a live re-fetch of the original listing — see FavouriteRowItem's
 * own doc comment for why, and getFavourites'/ensureFavouritesTable's in
 * lib/data/postgres.ts for the full original reasoning.
 */
export default async function Favourites({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const favourites = await db.getFavourites(club.club_id);
  const base = `/dashboard/${clubToken}`;

  const byCategory = new Map<string, typeof favourites>();
  for (const f of favourites) {
    const list = byCategory.get(f.category) ?? [];
    list.push(f);
    byCategory.set(f.category, list);
  }

  return (
    <div className="card outreach-card">
      <h2>
        Favourites <span className="count-badge">{favourites.length} saved</span>
      </h2>
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginTop: -8, marginBottom: 20, maxWidth: "58ch" }}>
        Everything your club has saved, in one place. Tap the heart on any player, business,
        venue, or story to add it here.
      </p>

      {favourites.length === 0 ? (
        <EmptyState
          message="No favourites yet — tap the heart on anything you'd like to come back to."
          cta="Start with Outreach"
          href={`${base}/outreach/players`}
        />
      ) : (
        CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => (
          <div key={cat} className="favourite-section">
            <h3 className="favourite-section-title">
              {CATEGORY_LABEL[cat]} <span className="count-badge">{byCategory.get(cat)!.length}</span>
            </h3>
            <div className="favourite-list">
              {byCategory.get(cat)!.map((f) => (
                <FavouriteRowItem
                  key={`${cat}-${f.item_id}`}
                  clubToken={clubToken}
                  club_id={club.club_id}
                  category={cat}
                  item_id={f.item_id}
                  title={f.title}
                  subtitle={f.subtitle}
                  href={f.href}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
