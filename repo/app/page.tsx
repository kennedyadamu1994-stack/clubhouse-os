import Link from "next/link";
import { Building2, UserRound, ArrowRight } from "lucide-react";
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
 * REDESIGNED THREE TIMES (15-16 Sep). First pass used the real
 * photo+scrim splash treatment the welcome pages already use — Kennedy
 * called the result "horrible... not accessible or attractive," and
 * asked for "big and bold and simplicity" instead. Second pass dropped
 * the photo for two large flat colour panels — closer, but Kennedy
 * then asked for "more texture, icon, buttons and actual design
 * intelligence... doesn't have to be busy, just clean, minimalist and
 * professional." This third pass keeps the same two-panel structure
 * (Kennedy never said the panels themselves were wrong, only that they
 * were flat and under-designed) and adds: a real Lucide icon per panel
 * (Building2/UserRound — Kennedy's own explicit decision, 16 Sep, was
 * to keep this app's real icon library and brand colours rather than
 * adopt a different, installed design skill's specific font/icon/
 * colour rules, which would have replaced rather than refined the
 * existing brand), a subtle dot-grid texture for depth (.splash-
 * choice-texture, app/globals.css — a background-image at very low
 * opacity, so it reads as texture, not a busy pattern), a real hover
 * interaction (a soft brightness lift + the "Enter" arrow sliding
 * right, both pure CSS :hover transitions — no client-side JS needed
 * for this, transform/opacity only, matching the "motion should feel
 * invisible" principle from the design skills consulted for this
 * pass), and an explicit "Enter →" affordance, so each panel doesn't
 * rely purely on "the whole block is clickable" with no visible cue.
 *
 * Pink for Player OS, blue for Club House OS (16 Sep, Kennedy's real,
 * specific hex values: #ff006e and #3a86ff — replacing the earlier
 * pink/black pairing, which used this app's own --pink token and the
 * .btn-black convention). These were close to but not identical to
 * --pink (#ff1b6e), so they were applied as literal hex values here
 * rather than substituted for the token — Kennedy gave exact codes
 * that time, not a request to reuse the existing brand colour.
 *
 * REVISED 18 Sep (monochrome pass, Kennedy: "no more pink, go
 * monochrome for the theme") — both panels are now two distinct
 * near-black shades (#1c1c1c / #000000) instead of hues, genuinely
 * back to a black/near-black pairing (closer to the ORIGINAL pairing
 * this same comment describes above, before the 16 Sep colour change,
 * just two shades of black rather than pink/black specifically) —
 * still two visually distinguishable panels, no colour in either.
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
  const [clubs, players] = await Promise.all([db.getAllClubsForDirectory(), db.getPlayers()]);
  const chosHref = clubs.length === 1 ? `/dashboard/${clubs[0].club_token}` : "/directory";

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 24px 0", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
        <img src={NBRH_LOGO_URL} alt="The NBRH" style={{ height: 28 }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexWrap: "wrap" }}>
        <SplashPanel
          href={chosHref}
          background="#1c1c1c"
          title="Club House OS"
          description="For clubs — outreach, sponsorship, and tools."
          stat={`${clubs.length} club${clubs.length === 1 ? "" : "s"} and counting`}
          Icon={Building2}
        />
        <SplashPanel
          href="/players"
          background="#000000"
          title="Player OS"
          description="For players — find sessions, clubs, and opportunities near you."
          stat={`${players.length} player${players.length === 1 ? "" : "s"} and counting`}
          Icon={UserRound}
        />
      </div>
    </main>
  );
}

function SplashPanel({
  href,
  background,
  title,
  description,
  stat,
  Icon,
}: {
  href: string;
  background: string;
  title: string;
  description: string;
  stat: string;
  Icon: typeof Building2;
}) {
  return (
    <Link href={href} className="splash-choice-panel" style={{ background }}>
      <span className="splash-choice-texture" aria-hidden />
      <Icon size={40} strokeWidth={1.4} aria-hidden className="splash-choice-icon" />
      <h1 className="splash-choice-title">{title}</h1>
      <p className="splash-choice-desc">{description}</p>
      <p className="splash-choice-stat">{stat}</p>
      <span className="splash-choice-cta">
        Enter
        <ArrowRight size={16} aria-hidden className="splash-choice-arrow" />
      </span>
    </Link>
  );
}
