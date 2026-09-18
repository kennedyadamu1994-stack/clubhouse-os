import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { HeaderCarousel } from "@/components/header-carousel";
import { NavLinks, TabBar } from "@/components/nav";
import { ClubDeckHeader } from "@/components/greeting";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
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
          {/* ClubDeckHeader owns the eyebrow/date/toggle-position branch
              (Overview vs every other CHOS page) — see its own doc
              comment in components/greeting.tsx for why this moved out
              of this layout file: a shared layout can't conditionally
              render per-route without a client component doing the
              pathname check, which is exactly what this is. */}
          <ClubDeckHeader clubName={club.name} balance={balance} allocation={allocation} pct={pct} />

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
