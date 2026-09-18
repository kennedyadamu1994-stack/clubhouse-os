import Link from "next/link";
import { InstagramIcon, type ExtraSocialLink } from "./social-icons";
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
 *     on any SaaS footer. Takes a ready-made contactHref/contactExternal
 *     pair rather than a clubToken+planTier to derive internally (POS,
 *     15 Sep — this footer now also renders under /players/[playerToken],
 *     which has no plan tier at all) — the caller (dashboard layout or
 *     player layout) decides the real destination and whether it's an
 *     in-app Link or an external anchor; this component just renders
 *     whichever it's given.
 *   - Social links: Instagram only on CHOS (7 Sep — Kennedy asked for X
 *     and Facebook removed, and the real Instagram URL wired in). Uses
 *     the real brand icon (components/social-icons.tsx) rather than a
 *     text label — lucide-react (this app's only icon library) ships no
 *     brand-specific glyphs at all, so this is a hand-built inline SVG
 *     of Instagram's actual mark. aria-label carries the platform name
 *     for screen readers, since the icon alone (aria-hidden) carries no
 *     text.
 *   - extraSocialLinks (15 Sep) — POS-only additional icons (Kennedy:
 *     "add LinkedIn, TikTok & YouTube to social footer icons... for the
 *     POS" — explicitly scoped to POS, not CHOS, so this is an optional
 *     prop CHOS's own footer call never passes, exactly the same
 *     additive pattern as showPeople/hideEvents/cardRenderer on
 *     NbrhEngine). href="#" placeholders until Kennedy provides the
 *     real URLs — real hrefs would be needed to make these genuinely
 *     functional, not just visually present.
 *   - Copyright line with the real NBRH name and current year, computed
 *     rather than hardcoded so it never goes stale.
 */
const INSTAGRAM_URL = "https://www.instagram.com/the_nbrh/";

export function AppFooter({
  contactHref,
  contactExternal,
  extraSocialLinks,
}: {
  contactHref: string;
  /** True for a placeholder/external URL (opens in a new tab, rel=noopener) — false for a real in-app route (uses next/link). */
  contactExternal: boolean;
  /** POS-only additional social icons, rendered after Instagram — see doc comment above. Omitted entirely by CHOS's own dashboard layout. */
  extraSocialLinks?: ExtraSocialLink[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <nav className="app-footer-links" aria-label="Legal and support">
          <LegalLinks />
          {contactExternal ? (
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
          {extraSocialLinks?.map(({ label, href, Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
              <Icon />
            </a>
          ))}
        </nav>

        <PaletteToggle />

        <p className="app-footer-copyright">© {year} The NBRH. All rights reserved.</p>
      </div>
    </footer>
  );
}
