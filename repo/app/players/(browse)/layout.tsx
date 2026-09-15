import { getAdapter } from "@/lib/data";
import { PlayerHeader } from "@/components/player-header";
import { PlayerNavLinks, PlayerTabBar, PlayerPageTitle } from "@/components/player-nav";
import { HeaderCarousel } from "@/components/header-carousel";
import { Greeting, DateLine } from "@/components/greeting";
import { AppFooter } from "@/components/app-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { IframeResizeReporter } from "@/components/iframe-resize-reporter";

/**
 * Layout for the PUBLIC POS route tree (/players/search|calendar|jobs,
 * no token) — the missing piece Kennedy flagged (15 Sep): "the sticky
 * bar is now gone... the header is gone too on the calendar and jobs
 * page." There never was a layout above these three public pages, only
 * the app-wide root layout (fonts/theme script, no header at all) —
 * this is that missing shell, mirroring app/players/[playerToken]/
 * layout.tsx's own structure exactly, just without a token to look up
 * or guard on.
 *
 * A separate file, not a fallback branch inside the token'd layout —
 * Next.js route groups render whichever layout is actually above a
 * given page in the file tree, so this has to exist in its own right
 * for calendar/jobs/search to ever get a header/nav/footer at all.
 *
 * Lives inside a (browse) route group — a parenthesised folder is
 * invisible to the real URL (this still serves at /players/calendar,
 * /players/jobs, /players/search/[category], exactly as before), but
 * it DOES scope which pages this layout wraps. Without that grouping,
 * a layout placed directly in app/players/ would also wrap
 * app/players/page.tsx (the landing page), which sits at that same
 * directory level — Next.js applies a layout to every page below it,
 * including a page.tsx at the same level, not just "sibling route
 * pages." The landing page and /choose (the CHOS/POS splash) both need
 * their own minimal header, not the full sidebar/tab-bar shell, so
 * this group keeps them out from under this layout entirely.
 *
 * HeaderCarousel is included (15 Sep fix, Kennedy: "the header carousel
 * is gone") — getHeaderImages() is genuinely platform-wide already (no
 * club_id argument, same category as getEvents()), so there was never
 * a real reason to leave it out; it was simply missed the first time
 * this layout was built. Alt text is generic (no single club/sport to
 * describe on POS), unlike CHOS's own club-specific alt string.
 */
export default async function PublicPlayersLayout({ children }: { children: React.ReactNode }) {
  const db = getAdapter();
  const headerImages = await db.getHeaderImages();

  return (
    <>
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

          <header className="deck-head">
            <div>
              <p className="eyebrow">
                <Greeting />
              </p>
              <h1 className="deck-title">
                <PlayerPageTitle />
              </h1>
            </div>
            <div className="deck-head-controls">
              <DateLine />
              <ThemeToggle />
            </div>
          </header>

          {children}

          <AppFooter contactHref="https://thenbrh.co.uk" contactExternal />
        </div>

        <PlayerTabBar />
      </div>
    </>
  );
}
