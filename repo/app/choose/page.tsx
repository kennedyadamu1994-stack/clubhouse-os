import Link from "next/link";
import { NBRH_LOGO_URL } from "@/lib/brand";

/**
 * CHOS/POS splash (15 Sep, Kennedy: "create a splash page that gives
 * the user the option to either choose the CHOS or POS. Like a home
 * page?") — replaces the earlier "For Clubs" toggle target, which
 * Kennedy flagged as wrong (it sent a player straight to
 * thenbrh.co.uk instead of back toward CHOS). Both toggles
 * (AppHeader for CHOS → POS, PlayerHeader for POS → CHOS) now point
 * here instead of guessing a specific destination on the other side.
 *
 * The POS card is unconditionally real — /players is a genuine, working
 * public landing page. The CHOS card is honestly weaker: there is no
 * public, non-admin CHOS entry point today. /directory is the closest
 * real page, but it's requireAdminOrRedirect-gated (see app/directory/
 * page.tsx) — a non-admin clicking it hits the admin login screen, not
 * a club dashboard. Flagged here rather than silently accepted, since
 * Kennedy may want a real public CHOS landing built, the same way
 * /players now has one.
 */
export default function ChooseApp() {
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
      <h1 style={{ marginBottom: 12 }}>Which side of The NBRH?</h1>
      <p style={{ color: "var(--dim)", maxWidth: "44ch", margin: "0 auto 40px", fontSize: "0.95rem" }}>
        Club House OS is for clubs. Player OS is for individual players.
      </p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/directory"
          className="card"
          style={{ width: 260, textDecoration: "none", padding: 28, display: "block" }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Club House OS</h2>
          <p style={{ color: "var(--dim)", fontSize: "0.85rem", margin: 0 }}>
            Run your club — outreach, sponsorship, and tools.
          </p>
        </Link>

        <Link
          href="/players"
          className="card"
          style={{ width: 260, textDecoration: "none", padding: 28, display: "block" }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Player OS</h2>
          <p style={{ color: "var(--dim)", fontSize: "0.85rem", margin: 0 }}>
            Find sessions, clubs, and opportunities near you.
          </p>
        </Link>
      </div>
    </main>
  );
}
