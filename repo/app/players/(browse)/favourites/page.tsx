"use client";

import { usePlayerSession } from "@/components/player-session";
import { PlayerFavouriteRowItem } from "@/components/player-favourite-row-item";
import { EmptyState } from "@/components/empty-state";

/**
 * Player Favourites (15 Sep) — this page genuinely did not exist before
 * now, despite the header's hamburger dropdown linking to it since
 * favourites were first built; clicking it hit this app's own generic
 * 404 (app/not-found.tsx), which Kennedy correctly flagged as "That
 * link doesn't work." This is the real page.
 *
 * Mirrors CHOS's own Favourites page (app/dashboard/[clubToken]/
 * favourites/page.tsx) structurally — category sections, count badges,
 * EmptyState — but genuinely simpler: no resolveActionsFor/ActionPopup
 * rebuild, since a player's favourite has no token-spend actions to
 * reconstruct; PlayerFavouriteRowItem just links straight out.
 *
 * A client component, not a server page with a token guard — the
 * identity here is the email session (usePlayerSession), which only
 * exists client-side (localStorage-persisted), so there's no server-
 * side club/player token to look this page up by the way CHOS's
 * version does with clubToken.
 */
const CATEGORY_LABEL: Record<string, string> = {
  Activities: "Activities",
  Clubs: "Clubs",
  Leagues: "Leagues",
  Venues: "Venues",
  Events: "Events",
  People: "People",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL);

export default function PlayerFavourites() {
  const { player, loading, favouritesRows } = usePlayerSession();

  if (loading) {
    return (
      <div className="card outreach-card">
        <div className="sr-loading">
          <div className="sr-spin" />
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="card outreach-card">
        <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "58ch" }}>
          Sign in to see everything you&apos;ve saved.
        </p>
        <EmptyState
          message="Favourites are personal to you — sign in with your email to see what you've saved."
          cta="Sign in"
          href="/players/recommendations"
        />
      </div>
    );
  }

  const byCategory = new Map<string, typeof favouritesRows>();
  for (const f of favouritesRows) {
    const list = byCategory.get(f.category) ?? [];
    list.push(f);
    byCategory.set(f.category, list);
  }

  return (
    <div className="card outreach-card">
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "58ch" }}>
        Everything you&apos;ve saved, in one place. Tap the heart on anything you&apos;d like to come
        back to. <span className="count-badge">{favouritesRows.length} saved</span>
      </p>

      {favouritesRows.length === 0 ? (
        <EmptyState
          message="No favourites yet — tap the heart on anything you'd like to come back to."
          cta="Browse Search"
          href="/players/search"
        />
      ) : (
        CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => (
          <div key={cat} className="favourite-section">
            <h3 className="favourite-section-title">
              {CATEGORY_LABEL[cat]} <span className="count-badge">{byCategory.get(cat)!.length}</span>
            </h3>
            <div className="favourite-list">
              {byCategory.get(cat)!.map((f) => (
                <PlayerFavouriteRowItem
                  key={`${cat}-${f.item_id}`}
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
