import Link from "next/link";
import { InstagramIcon, XIcon, FacebookIcon } from "./social-icons";

/**
 * App footer (Kennedy's request, 27 Aug: "elements that should be there,
 * both for best practice and legally required"). Every link below is a
 * placeholder — Kennedy confirmed he's happy with placeholders for now —
 * but the set itself is deliberate:
 *
 *   - Privacy Policy, Terms of Service, Cookie Policy: the three pages a
 *     UK-facing product handling personal data (player/contact info, per
 *     CLAUDE.md's own GDPR rule) needs at minimum. Genuinely legally
 *     expected, not just convention.
 *   - Contact / Help: best-practice, not legally required, but standard
 *     on any SaaS footer and already has a real destination in-app
 *     (Tools → Contact Us) rather than being a dead placeholder. Takes
 *     clubToken and builds an absolute path — this footer renders at
 *     every depth under /dashboard/[clubToken]/..., so a relative link
 *     would break depending on how deep the current page is.
 *   - Social links: Instagram/X/Facebook, real brand icons (components/
 *     social-icons.tsx) rather than text labels — lucide-react (this
 *     app's only icon library) ships no brand-specific glyphs at all, so
 *     these are hand-built inline SVGs of each platform's actual mark.
 *     aria-label on each link carries the platform name for screen
 *     readers, since the icon alone (aria-hidden) carries no text.
 *   - Copyright line with the real NBRH name and current year, computed
 *     rather than hardcoded so it never goes stale.
 *
 * PLACEHOLDER_URL is the one place to update every placeholder link once
 * real pages exist, same pattern as paywall-popup.tsx's PLANS_PAGE_URL.
 */
const PLACEHOLDER_URL = "https://thenbrh.co.uk"; // PLACEHOLDER — replace each with its real page once built

export function AppFooter({ clubToken }: { clubToken: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <nav className="app-footer-links" aria-label="Legal and support">
          <a href={PLACEHOLDER_URL} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          <a href={PLACEHOLDER_URL} target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>
          <a href={PLACEHOLDER_URL} target="_blank" rel="noopener noreferrer">
            Cookie Policy
          </a>
          <Link href={`/dashboard/${clubToken}/tools/contact`}>Contact / Help</Link>
        </nav>

        <nav className="app-footer-social" aria-label="Social media">
          <a href={PLACEHOLDER_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <InstagramIcon />
          </a>
          <a href={PLACEHOLDER_URL} target="_blank" rel="noopener noreferrer" aria-label="X">
            <XIcon />
          </a>
          <a href={PLACEHOLDER_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <FacebookIcon />
          </a>
        </nav>

        <p className="app-footer-copyright">© {year} The NBRH. All rights reserved.</p>
      </div>
    </footer>
  );
}
