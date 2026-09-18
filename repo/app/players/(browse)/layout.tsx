import { getAdapter } from "@/lib/data";
import { PlayerHeader } from "@/components/player-header";
import { PlayerNavLinks, PlayerTabBar, PlayerPageTitle } from "@/components/player-nav";
import { HeaderCarousel } from "@/components/header-carousel";
import { AppFooter } from "@/components/app-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { IframeResizeReporter } from "@/components/iframe-resize-reporter";
import { PlayerSessionProvider } from "@/components/player-session";
import { POS_EXTRA_SOCIAL_LINKS } from "@/lib/players/social-links";

/**
 * Layout for the PUBLIC POS route tree — /players itself (Home), plus
 * /players/search|calendar|jobs|recommendations, no token. Mirrors
 * app/players/[playerToken]/layout.tsx's own structure exactly, just
 * without a token to look up or guard on.
 *
 * A separate file, not a fallback branch inside the token'd layout —
 * Next.js route groups render whichever layout is actually above a
 * given page in the file tree, so this has to exist in its own right
 * for these pages to ever get a header/nav/footer at all.
 *
 * Lives inside a (browse) route group — a parenthesised folder is
 * invisible to the real URL (this still serves at /players,
 * /players/calendar, /players/jobs, /players/search/[category],
 * /players/recommendations). The group exists so this layout can be
 * scoped precisely, in case a future page under app/players/ ever
 * needs to sit outside the full shell again — right now (15 Sep
 * restructure) every real page here, including Home itself, uses it;
 * there is no separate minimal landing page any more (Kennedy: "this
 * page shouldn't exist at all & should immediately show the full
 * sidebar/tab-bar shell"). The CHOS/POS choice screen lives at "/",
 * a completely separate route outside app/players/ entirely — see
 * app/page.tsx's own doc comment.
 *
 * HeaderCarousel is included — getHeaderImages() is genuinely
 * platform-wide already (no club_id argument, same category as
 * getEvents()). Alt text is generic (no single club/sport to describe
 * on POS), unlike CHOS's own club-specific alt string.
 */
export default async function PublicPlayersLayout({ children }: { children: React.ReactNode }) {
  const db = getAdapter();
  const headerImages = await db.getHeaderImages();

  return (
    <PlayerSessionProvider>
      <PlayerHeader />
      <div className="shell">
        <IframeResizeReporter />
        <nav className="sidebar" aria-label="Sections">
          <div className="sidebar-sticky">
            <div className="wordmark">
              <span>
                <span className="t1">The NBRH</span>
              </span>
            </div>
            <PlayerNavLinks />
          </div>
        </nav>

        <div className="main">
          <HeaderCarousel
            slides={headerImages.map((h) => ({ image_url: h.image_url, url: h.url }))}
            alt="Grassroots sport across The NBRH"
          />
          {/* Theme toggle moved here, right below the carousel (18 Sep,
              Kennedy: same change as CHOS's own layout — see
              app/dashboard/[clubToken]/layout.tsx's matching comment for
              the fuller reasoning). Eyebrow "Hello" and date both removed
              outright, not relocated. */}
          <div className="deck-toggle-row">
            <ThemeToggle />
          </div>

          <header className="deck-head">
            <h1 className="deck-title">
              <PlayerPageTitle />
            </h1>
          </header>

          {children}

          <AppFooter contactHref="https://thenbrh.co.uk" contactExternal extraSocialLinks={POS_EXTRA_SOCIAL_LINKS} />
        </div>

        <PlayerTabBar />
      </div>
    </PlayerSessionProvider>
  );
}
