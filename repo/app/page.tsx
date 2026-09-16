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
 * REDESIGNED TWICE (15 Sep). First pass used the real photo+scrim
 * splash treatment the welcome pages already use — Kennedy called the
 * result "horrible... not accessible or attractive," and asked for
 * "big and bold and simplicity" instead. The real problem wasn't the
 * photo treatment itself, it was that this page still rendered the
 * choice as two small (240px) text cards floating in a lot of empty
 * space — a busy photo background competing with a timid, tiny choice,
 * the opposite of bold. This second pass drops the photo entirely and
 * makes the two options themselves the ENTIRE page: two large,
 * full-height colour panels, side by side, each with one big word and
 * nothing else competing for attention. Pink for Player OS (this app's
 * own real, confirmed-AA-compliant --pink token, text always white per
 * the established D11 decision — see app/globals.css's own comment on
 * that token) and black for Club House OS (the same .btn-black "self-
 * serve action" convention already used elsewhere in this app, not an
 * arbitrary second colour). Genuinely simple: one word, one line of
 * context, one click, per side.
 *
 * The CHOS panel reuses this page's own original one-club lookup logic
 * (pilot has exactly one club, so it looks it up server-side and links
 * straight to its dashboard — never a hardcoded token, so nothing here
 * breaks if that token is ever rotated; see README's "rotate before
 * real use" note) rather than the admin-gated /directory. If a second
 * club is ever onboarded, this falls back to the internal multi-club
 * directory the same way the original root page always did.
 */
export default async function Home() {
  const db = getAdapter();
  const clubs = await db.getAllClubsForDirectory();
  const chosHref = clubs.length === 1 ? `/dashboard/${clubs[0].club_token}` : "/directory";

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 24px 0", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
        <img src={NBRH_LOGO_URL} alt="The NBRH" style={{ height: 28 }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexWrap: "wrap" }}>
        <Link
          href={chosHref}
          style={{
            flex: "1 1 320px",
            minHeight: "45vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "48px 32px",
            textDecoration: "none",
            background: "#000000",
            color: "#ffffff",
            transition: "opacity 0.2s ease",
          }}
        >
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 400, fontSize: "clamp(2.4rem, 6vw, 4rem)", lineHeight: 1.05, marginBottom: 16 }}>
            Club House OS
          </h1>
          <p style={{ fontSize: "1.05rem", opacity: 0.75, maxWidth: "32ch" }}>
            For clubs — outreach, sponsorship, and tools.
          </p>
        </Link>

        <Link
          href="/players"
          style={{
            flex: "1 1 320px",
            minHeight: "45vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "48px 32px",
            textDecoration: "none",
            background: "var(--pink)",
            color: "#ffffff",
            transition: "opacity 0.2s ease",
          }}
        >
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 400, fontSize: "clamp(2.4rem, 6vw, 4rem)", lineHeight: 1.05, marginBottom: 16 }}>
            Player OS
          </h1>
          <p style={{ fontSize: "1.05rem", opacity: 0.9, maxWidth: "32ch" }}>
            For players — find sessions, clubs, and opportunities near you.
          </p>
        </Link>
      </div>
    </main>
  );
}
