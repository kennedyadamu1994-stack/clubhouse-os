import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { NavLinks, TabBar } from "@/components/nav";

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
          Club House <em>OS</em>
        </div>
        <NavLinks clubToken={clubToken} />
      </nav>

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{club.name}</h1>
            <p className="club-line">
              {club.sport} · {club.area} · <strong>{club.plan_tier === "premium" ? "Premium" : "Core"}</strong> plan
            </p>
          </div>
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
        </header>

        {children}
      </div>

      <TabBar clubToken={clubToken} />
    </div>
  );
}
