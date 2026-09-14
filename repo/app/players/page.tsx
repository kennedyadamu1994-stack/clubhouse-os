import { NBRH_LOGO_URL } from "@/lib/brand";
import { AppFooter } from "@/components/app-footer";
import { PaletteToggle } from "@/components/palette-toggle";

/**
 * POS landing page, no player token — the target of both directions of
 * the CHOS/POS toggle (Kennedy's 9 Sep concept, built out 15 Sep): CHOS's
 * "For Players" link points here, and this page's own "For Clubs" link
 * points back to CHOS. Also where anyone lands who hits /players
 * directly with no token of their own yet.
 *
 * Deliberately minimal — this is a placeholder entry point, not real
 * marketing copy (that's a separate task). Its one real job is to link
 * out to the actual onboarding widget once its hosting/URL is
 * confirmed — that URL was never confirmed (see AppHeader's own doc
 * comment on why the toggle points here rather than guessing at it),
 * so this stays a placeholder link until Kennedy provides the real one.
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
          Find sessions, clubs, leagues, and opportunities near you — free, always. Tell us what
          you&apos;re into and we&apos;ll match you to what&apos;s actually worth your time.
        </p>
        {/* PLACEHOLDER — replace with the real onboarding widget's URL once confirmed. */}
        <a href="https://thenbrh.co.uk" className="btn btn-pink" style={{ display: "inline-flex" }}>
          Get Started
        </a>
      </main>

      <AppFooter contactHref="https://thenbrh.co.uk" contactExternal />
    </>
  );
}
