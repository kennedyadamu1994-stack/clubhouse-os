import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { PlayerHeader } from "@/components/player-header";
import { PlayerNavLinks, PlayerTabBar, PlayerDeckHeader } from "@/components/player-nav";
import { HeaderCarousel } from "@/components/header-carousel";
import { AppFooter } from "@/components/app-footer";
import { IframeResizeReporter } from "@/components/iframe-resize-reporter";
import { PlayerSessionProvider } from "@/components/player-session";
import { POS_EXTRA_SOCIAL_LINKS } from "@/lib/players/social-links";

/**
 * Everything under /players/[playerToken] is scoped here, server-side —
 * mirrors app/dashboard/[clubToken]/layout.tsx's own structure and
 * guard pattern exactly (invalid token → designed 404, the client never
 * receives another player's data), but built as its own layout rather
 * than a mode on the dashboard one: no plan tier, no token balance, no
 * club sidebar wordmark, and a completely different 5-section nav
 * (Home/Search/Calendar/Jobs/Recommendations vs
 * Outreach/Workspace/Tools/Services) — see PlayerNavLinks' own doc
 * comment in components/player-nav.tsx for the full reasoning on why
 * that's a separate component rather than a branch inside NavLinks.
 *
 * getPlayerByToken (not getPlayers/gatePlayer) is the right lookup
 * here — a player looking at their OWN page is the one legitimate
 * player-facing case where their real name should show; see that
 * method's own doc comment (lib/data/index.ts) for why it's a
 * deliberately separate exception from the admin-only
 * getPlayersUnfiltered.
 *
 * HeaderCarousel is included (15 Sep fix, Kennedy: "the header carousel
 * is gone") — getHeaderImages() is platform-wide already (no club_id
 * argument), matching the same public data getEvents() already reads
 * for Calendar; there was never a real reason to leave it out here.
 * Alt text uses the player's own first favourite sport when they have
 * one, same idea as CHOS's club.sport, falling back to something
 * generic when they don't (a player can have none, unlike a club).
 */
export default async function PlayerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ playerToken: string }>;
}) {
  const { playerToken } = await params;
  const db = getAdapter();
  const player = await db.getPlayerByToken(playerToken);
  if (!player) notFound();

  const headerImages = await db.getHeaderImages();

  return (
    <PlayerSessionProvider>
      <PlayerHeader playerToken={playerToken} />
      <div className="shell">
        <IframeResizeReporter />
        <nav className="sidebar" aria-label="Sections">
          <div className="sidebar-sticky">
            <div className="wordmark">
              <span>
                <span className="t1">{player.name ?? "Your NBRH"}</span>
              </span>
            </div>
            <PlayerNavLinks playerToken={playerToken} />
          </div>
        </nav>

        <div className="main">
          <HeaderCarousel
            slides={headerImages.map((h) => ({ image_url: h.image_url, url: h.url }))}
            alt={player.sports[0] ? `${player.sports[0]} across The NBRH` : "Grassroots sport across The NBRH"}
          />
          {/* PlayerDeckHeader owns the eyebrow/date/toggle-position branch
              (Home vs every other page) — see its own doc comment in
              components/player-nav.tsx. playerName is passed here (this
              is the signed-in tree) so the eyebrow reads "Hello, {name}"
              on every non-Home page, exactly as it did before 18 Sep. */}
          <PlayerDeckHeader playerName={player.name} />

          {children}

          <AppFooter contactHref="https://thenbrh.co.uk" contactExternal extraSocialLinks={POS_EXTRA_SOCIAL_LINKS} />
        </div>

        <PlayerTabBar playerToken={playerToken} />
      </div>
    </PlayerSessionProvider>
  );
}
