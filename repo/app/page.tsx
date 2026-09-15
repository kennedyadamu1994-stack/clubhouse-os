import Link from "next/link";
import { getAdapter } from "@/lib/data";
import { NBRH_LOGO_URL } from "@/lib/brand";

/**
 * General splash page — the public front door at "/" (15 Sep restructure,
 * Kennedy: "when I open the link, the first thing I should see is the
 * choice between the club house OS and the player OS"). Previously this
 * page skipped that choice entirely and went straight to CHOS — it
 * predates POS, and a separate /choose page was built alongside it
 * without ever actually being wired in as the real entry point, so the
 * literal root link still bypassed the choice Kennedy asked for. This
 * replaces /choose's content here instead of leaving two overlapping
 * "pick CHOS or POS" pages; /choose no longer exists as a separate
 * route (both toggles — AppHeader for CHOS, PlayerHeader for POS — now
 * point at "/" instead).
 *
 * The CHOS card reuses this page's own original one-club lookup logic
 * (pilot has exactly one club, so it looks it up server-side and links
 * straight to its dashboard — never a hardcoded token, so nothing here
 * breaks if that token is ever rotated; see README's "rotate before
 * real use" note) rather than the earlier /choose page's plain link to
 * /directory, which is requireAdminOrRedirect-gated and would have
 * bounced a non-admin visitor to an admin login screen instead of a
 * real club dashboard. If a second club is ever onboarded, this falls
 * back to the internal multi-club directory the same way the original
 * root page always did.
 */
export default async function Home() {
  const clubs = await getAdapter().getAllClubsForDirectory();
  const chosHref = clubs.length === 1 ? `/dashboard/${clubs[0].club_token}` : "/directory";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
      <img src={NBRH_LOGO_URL} alt="The NBRH" style={{ height: 32, marginBottom: 32 }} />
      <p className="eyebrow" style={{ marginBottom: 14 }}>
        The Neighbourhood
      </p>
      <h1 style={{ marginBottom: 12 }}>Which side of The NBRH?</h1>
      <p style={{ color: "var(--dim)", maxWidth: "44ch", margin: "0 auto 40px", fontSize: "0.95rem" }}>
        Club House OS is for clubs. Player OS is for individual players.
      </p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href={chosHref} className="card" style={{ width: 260, textDecoration: "none", padding: 28, display: "block" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Club House OS</h2>
          <p style={{ color: "var(--dim)", fontSize: "0.85rem", margin: 0 }}>
            Run your club — outreach, sponsorship, and tools.
          </p>
        </Link>

        <Link href="/players" className="card" style={{ width: 260, textDecoration: "none", padding: 28, display: "block" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Player OS</h2>
          <p style={{ color: "var(--dim)", fontSize: "0.85rem", margin: 0 }}>
            Find sessions, clubs, and opportunities near you.
          </p>
        </Link>
      </div>
    </main>
  );
}
