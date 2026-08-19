import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { DEMO_CAROUSEL_IMAGES } from "@/lib/header-image";
import { HeaderCarousel } from "@/components/header-carousel";
import { NavLinks, TabBar } from "@/components/nav";
import { Greeting, DateLine, PageTitle, TokenWidget } from "@/components/greeting";
import { NBRH_LOGO_URL } from "@/lib/brand";
import { ThemeToggle } from "@/components/theme-toggle";

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

  const { balance, allocation } = await db.getTokenBalance(club.club_id);
  const pct = allocation > 0 ? Math.max(0, Math.min(100, (balance / allocation) * 100)) : 0;

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Sections">
        <div className="wordmark">
          <span>
            <span className="t1">{club.name}</span>
            <br />
            <span className="badge" style={{ marginTop: 6 }}>
              {club.plan_tier === "premium" ? "Premium" : "Core"}
            </span>
          </span>
        </div>
        <NavLinks clubToken={clubToken} />
        <div className="sidefoot">
          {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
          <img src={NBRH_LOGO_URL} alt="The NBRH" className="sidefoot-logo" />
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
      </div>

      <TabBar clubToken={clubToken} />
    </div>
  );
}
