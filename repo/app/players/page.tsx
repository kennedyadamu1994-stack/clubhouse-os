import Link from "next/link";
import { NBRH_LOGO_URL } from "@/lib/brand";
import { AppFooter } from "@/components/app-footer";
import { PaletteToggle } from "@/components/palette-toggle";
import { ArrowLeftRight, Search, Calendar, Briefcase } from "lucide-react";

/**
 * POS landing page, no player token — the target of both directions of
 * the CHOS/POS toggle (Kennedy's 9 Sep concept, built out 15 Sep): CHOS's
 * "For Players" link points here, and this page's own "For Clubs" link
 * points back to CHOS. Also where anyone lands who hits /players
 * directly with no token of their own yet.
 *
 * Real browse links to Search/Calendar/Jobs (15 Sep fix) — Kennedy:
 * "the POS isn't operational right now, it's just linking to the NBRH
 * website. I want an operational OS that is all accessible within the
 * OS." The three pages these link to are real, working, publicly
 * readable pages (no token needed) — Search/Calendar/Jobs' own public
 * route trees. "Get started" (onboarding) stays as a secondary action,
 * not the only one, since Kennedy separately confirmed (15 Sep) that
 * clicking "For Players" from CHOS with no player token should load a
 * genuine public browsing experience, personalisation coming only once
 * someone actually onboards.
 *
 * The onboarding widget's own hosted URL was never confirmed (see
 * AppHeader's own doc comment) — "Get started" below still points at
 * the same placeholder until Kennedy provides the real one; that one
 * link is the sole remaining external placeholder on this page.
 */
export default function PlayersLanding() {
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-brand">
            {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
            <img src={NBRH_LOGO_URL} alt="The NBRH" className="app-header-logo" />
            <span className="app-header-mode" aria-hidden>
              |
            </span>
            {/* Deliberately NOT /directory — that's requireAdminOrRedirect-gated (see app/directory/page.tsx), an admin tool, not a public club landing page. No real public "for clubs" page exists yet, so this uses the same PLACEHOLDER_URL pattern the rest of the app falls back to until one does. */}
            <a href="https://thenbrh.co.uk" className="app-header-mode-label">
              <ArrowLeftRight size={13} aria-hidden />
              For Clubs
            </a>
          </div>
          <div className="app-header-actions">
            <PaletteToggle />
          </div>
        </div>
      </header>

      <main style={{ minHeight: "70vh", padding: "64px 24px", textAlign: "center" }}>
        <h1 style={{ marginBottom: 12 }}>
          The NBRH <em style={{ color: "var(--pink)", fontStyle: "normal" }}>Player OS</em>
        </h1>
        <p style={{ color: "var(--dim)", maxWidth: "48ch", margin: "0 auto 32px", fontSize: "0.95rem" }}>
          Find sessions, clubs, leagues, and opportunities near you — free, always. Browse right
          now, or get started to save favourites and get matches personal to you.
        </p>

        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 32,
          }}
        >
          <Link href="/players/search/activities" className="btn btn-black" style={{ display: "inline-flex", gap: 8 }}>
            <Search size={16} aria-hidden />
            Search
          </Link>
          <Link href="/players/calendar" className="btn btn-black" style={{ display: "inline-flex", gap: 8 }}>
            <Calendar size={16} aria-hidden />
            Calendar
          </Link>
          <Link href="/players/jobs" className="btn btn-black" style={{ display: "inline-flex", gap: 8 }}>
            <Briefcase size={16} aria-hidden />
            Jobs
          </Link>
        </div>

        {/* PLACEHOLDER — replace with the real onboarding widget's URL once confirmed. */}
        <a href="https://thenbrh.co.uk" className="btn btn-pink" style={{ display: "inline-flex" }}>
          Get Started
        </a>
      </main>

      <AppFooter contactHref="https://thenbrh.co.uk" contactExternal />
    </>
  );
}
