import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { NavLinks, TabBar } from "@/components/nav";
import { Greeting, DateLine, PageTitle } from "@/components/greeting";

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
          <span className="mark">N</span>
          <span>
            <span className="t1">Club House OS</span>
            <br />
            <span className="t2">The NBRH</span>
          </span>
        </div>
        <NavLinks clubToken={clubToken} />
        <div className="sidefoot">
          <span className="avatar">{club.name.slice(0, 1).toUpperCase()}</span>
          <span className="sidefoot-club">
            <b>{club.name}</b>
            <span>
              {club.sport} · {club.area}
            </span>
          </span>
          <span className="badge">{club.plan_tier === "premium" ? "Premium" : "Core"}</span>
        </div>
      </nav>

      <div className="main">
        <header className="deck-head">
          <div>
            <p className="eyebrow">
              <Greeting />, {club.name}
            </p>
            <h1 className="deck-title">
              <PageTitle />
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <DateLine />
            <div className="tokens" aria-label={`${balance} of ${allocation} tokens remaining`}>
              <div>
                <div className="count">
                  <em>{balance}</em> / {allocation}
                </div>
                <div className="meta">tokens left</div>
              </div>
              <div>
                <div className="tokenbar" role="presentation">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <div className="meta" style={{ marginTop: 4 }}>
                  1 token ≈ 1 hour of NBRH time
                </div>
              </div>
            </div>
          </div>
        </header>

        {children}
      </div>

      <TabBar clubToken={clubToken} />
    </div>
  );
}
