"use client";

import Link from "next/link";

/**
 * The real CHOS/POS toggle, rebuilt as a genuine two-sided switch (16
 * Sep, Kennedy: "it should be an animated button that acts more like a
 * switch and clearly indicates which page is active and the one that
 * isn't"). Replaces the earlier single pill-shaped link (.app-header-
 * mode-label), which always looked the same regardless of which app
 * you were actually in — it linked to the other side but never showed
 * you where you currently were.
 *
 * Shared between AppHeader (CHOS) and PlayerHeader (POS) rather than
 * two separate copies — the only real difference between the two
 * call sites is which side is "active": CHOS's own header renders
 * <OsSwitch active="chos" />, POS's renders <OsSwitch active="pos" />.
 * Both labels are always visible; only the active one is filled.
 * Clicking the INACTIVE label navigates to that app (the one and only
 * real link this component renders); clicking the already-active
 * label does nothing, matching how a real settings toggle behaves —
 * you don't "navigate" to where you already are.
 *
 * REVISED (17 Sep, Kennedy: "needs to be better designed and perhaps
 * smaller. It looks unprofessional") — no separate sliding thumb
 * element anymore (see app/globals.css's own doc comment on
 * .os-switch for the full reasoning: a real screenshot showed "Club
 * House OS" clipped, caused by forcing both sides to equal widths so
 * the thumb could track a clean 50/50 split). Each side now just
 * fills with its own real brand colour directly when active — no
 * thumb to keep positioned/sized in sync with variable label lengths
 * at all, genuinely simpler and impossible to clip regardless of
 * which label is longer.
 *
 * The two real hex colours from the splash page ("/", app/page.tsx —
 * #ff006e for Player OS, #3a86ff for Club House OS) are reused here
 * too, so the active side's colour genuinely matches the app you're
 * actually in, not the generic --pink token both sides used before.
 */
export function OsSwitch({ active }: { active: "chos" | "pos" }) {
  return (
    <div className="os-switch" role="group" aria-label="Switch between Club House OS and Player OS">
      {active === "chos" ? (
        <span className="os-switch-side os-switch-side-chos os-switch-side-active" aria-current="page">
          Club House OS
        </span>
      ) : (
        <Link href="/" className="os-switch-side">
          Club House OS
        </Link>
      )}
      {active === "pos" ? (
        <span className="os-switch-side os-switch-side-pos os-switch-side-active" aria-current="page">
          Player OS
        </span>
      ) : (
        <Link href="/players" className="os-switch-side">
          Player OS
        </Link>
      )}
    </div>
  );
}
