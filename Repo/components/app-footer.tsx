import Link from "next/link";
import type { PlanTier } from "@/lib/types";
import { InstagramIcon } from "./social-icons";
import { PaletteToggle } from "./palette-toggle";
import { LegalLinks } from "./legal-links";

/**
 * App footer (Kennedy's request, 27 Aug: "elements that should be there,
 * both for best practice and legally required").
 *
 *   - Privacy Policy, Terms of Service, Cookie Policy: real content now
 *     (7 Sep — see lib/legal/*.ts), opening in an in-page popup rather
 *     than linking out, per Kennedy's explicit request. Previously
 *     placeholder links to thenbrh.co.uk.
 *   - Contact / Help: best-practice, not legally required, but standard
 *     on any SaaS footer and already has a real destination in-app
 *     (Tools → Contact Us) rather than being a dead placeholder. Takes
 *     clubToken and builds an absolute path — this footer renders at
 *     every depth under /dashboard/[clubToken]/..., so a relative link
 *     would break depending on how deep the current page is.
 *   - Social links: Instagram only (7 Sep — Kennedy asked for X and
 *     Facebook removed, and the real Instagram URL wired in). Uses the
 *     real brand icon (components/social-icons.tsx) rather than a text
 *     label — lucide-react (this app's only icon library) ships no
 *     brand-specific glyphs at all, so this is a hand-built inline SVG
 *     of Instagram's actual mark. aria-label carries the platform name
 *     for screen readers, since the icon alone (aria-hidden) carries no
 *     text.
 *   - Copyright line with the real NBRH name and current year, computed
 *     rather than hardcoded so it never goes stale.
 *
 * PLACEHOLDER_URL is the one remaining placeholder link (Contact/Help's
 * Free-tier fallback) — update once that page exists.
 */
const PLACEHOLDER_URL = "https://thenbrh.co.uk"; // PLACEHOLDER — replace once a real page exists
const INSTAGRAM_URL = "https://www.instagram.com/the_nbrh/";

export function AppFooter({ clubToken, planTier }: { clubToken: string; planTier: PlanTier }) {
  const year = new Date().getFullYear();
  // Tools → Contact Us is hidden and route-blocked for Free (1 Sep), so
  // the footer's Contact/Help link can't point there for Free clubs —
  // falls back to the same placeholder URL every other footer link
  // already uses, rather than linking to a page that would 404.
  const contactHref = planTier === "free" ? PLACEHOLDER_URL : `/dashboard/${clubToken}/tools/contact`;

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <nav className="app-footer-links" aria-label="Legal and support">
          <LegalLinks />
          {planTier === "free" ? (
            <a href={contactHref} target="_blank" rel="noopener noreferrer">
              Contact / Help
            </a>
          ) : (
            <Link href={contactHref}>Contact / Help</Link>
          )}
        </nav>

        <nav className="app-footer-social" aria-label="Social media">
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <InstagramIcon />
          </a>
        </nav>

        <PaletteToggle />

        <p className="app-footer-copyright">© {year} The NBRH. All rights reserved.</p>
      </div>
    </footer>
  );
}
