import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { DEMO_CAROUSEL_IMAGES } from "@/lib/header-image";
import { HeaderCarousel } from "@/components/header-carousel";
import { NavLinks, TabBar } from "@/components/nav";
import { Greeting, DateLine, PageTitle, TokenWidget } from "@/components/greeting";
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

  const [{ balance, allocation }, unreadCount] = await Promise.all([
    db.getTokenBalance(club.club_id),
    db.getUnreadInboxCount(club.club_id),
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
            <NavLinks clubToken={clubToken} />
          </div>
        </nav>

        <div className="main">
          <HeaderCarousel
            images={DEMO_CAROUSEL_IMAGES}
            alt={`${club.sport} session at ${club.name}`}
            clubName={club.name}
            tag={`${club.area} · ${club.sport}`}
          />

          <header className="deck-head">
            <div>
              <p className="eyebrow">
                <Greeting />, {club.name}
              </p>
              <h1 className="deck-title">
                <PageTitle />
              </h1>
            </div>
            <div className="deck-head-controls">
              <DateLine />
              <TokenWidget balance={balance} allocation={allocation} pct={pct} />
              <ThemeToggle />
            </div>
          </header>

          {children}

          <AppFooter clubToken={clubToken} />
        </div>

        <TabBar clubToken={clubToken} />
      </div>
    </>
  );
}
