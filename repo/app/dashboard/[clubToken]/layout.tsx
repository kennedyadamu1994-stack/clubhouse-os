import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { HeaderCarousel } from "@/components/header-carousel";
import { NavLinks, TabBar } from "@/components/nav";
import { PageTitle, TokenWidget } from "@/components/greeting";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { IframeResizeReporter } from "@/components/iframe-resize-reporter";
import { PLAN_TIER_LABEL } from "@/lib/types";

/**
 * Everything under /dashboard/[clubToken] is scoped here, server-side.
 * An invalid token → designed 404. The client never receives another club's data.
 */
export default async function DashboardLayout({
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

  const [{ balance, allocation }, unreadCount, headerImages] = await Promise.all([
    db.getTokenBalance(club.club_id),
    db.getUnreadInboxCount(club.club_id),
    db.getHeaderImages(),
  ]);
  const pct = allocation > 0 ? Math.max(0, Math.min(100, (balance / allocation) * 100)) : 0;

  return (
    <>
      <AppHeader clubToken={clubToken} unreadCount={unreadCount} />
      <div className="shell">
        <IframeResizeReporter />
        <nav className="sidebar" aria-label="Sections">
          <div className="sidebar-sticky">
            <div className="wordmark">
              <span>
                <span className="t1">{club.name}</span>
                <br />
                <span className="badge" style={{ marginTop: 6 }}>
                  {PLAN_TIER_LABEL[club.plan_tier]}
                </span>
              </span>
            </div>
            <NavLinks clubToken={clubToken} planTier={club.plan_tier} />
          </div>
        </nav>

        <div className="main">
          <HeaderCarousel
            slides={headerImages.map((h) => ({ image_url: h.image_url, url: h.url }))}
            alt={`${club.sport} session at ${club.name}`}
          />
          {/* Theme toggle moved here, right below the carousel (18 Sep,
              Kennedy: "remove the 'Hello' text... remove the date... make
              sure the day/night mode toggle is still on the right but just
              under the header carousel, so that it give more space for the
              rest of the content beneath to move up"). Previously sat
              inline in .deck-head-controls alongside DateLine and
              TokenWidget; with the greeting eyebrow and date both gone, the
              page's real content (Club Health, etc.) now starts right
              after the title instead of two rows further down. Plain
              document flow, right-aligned via .deck-toggle-row — NOT a
              flex sibling of the carousel itself, since .deck-banner's own
              negative margins (cancelling .main's padding for a full-bleed
              banner — see that class's own comment) make flex alignment
              alongside it unpredictable; simpler and more robust as its
              own row directly underneath. */}
          <div className="deck-toggle-row">
            <ThemeToggle />
          </div>

          <header className="deck-head">
            <h1 className="deck-title">
              <PageTitle />
            </h1>
            <TokenWidget balance={balance} allocation={allocation} pct={pct} />
          </header>

          {children}

          <AppFooter
            contactHref={club.plan_tier === "free" ? "https://thenbrh.co.uk" : `/dashboard/${clubToken}/tools/contact`}
            contactExternal={club.plan_tier === "free"}
          />
        </div>

        <TabBar clubToken={clubToken} planTier={club.plan_tier} />
      </div>
    </>
  );
}
