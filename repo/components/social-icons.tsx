/**
 * Real social platform icons for the footer (Kennedy's request, 29 Aug:
 * "can these be the relevant social media icons... instead of the text?").
 * lucide-react — this app's only installed icon library — ships zero
 * brand-specific glyphs (confirmed by searching its full ~4,050-icon set;
 * see app-footer.tsx's original doc comment, written when this was first
 * flagged as a gap). Rather than add a whole new icon package for three
 * icons, these are plain inline SVGs using each platform's real,
 * recognisable mark — `currentColor` so they inherit the footer link's
 * existing colour/hover treatment exactly like the text labels did.
 */

/**
 * Shared type for AppFooter's extraSocialLinks prop (app-footer.tsx) —
 * defined here alongside the icon components themselves, imported by
 * both app-footer.tsx and lib/players/social-links.ts.
 */
export interface ExtraSocialLink {
  label: string;
  href: string;
  Icon: (props: IconProps) => React.ReactElement;
}

type IconProps = { size?: number };

export function InstagramIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.15" fill="currentColor" />
    </svg>
  );
}

export function XIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 3h3.6l4.2 5.8L16.8 3H20l-6.3 8.2L20.4 21h-3.6l-4.6-6.3L6.9 21H3.7l6.7-8.7L4 3z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FacebookIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 8.5H17V5.5h-2.5C12.6 5.5 11 7.1 11 9.3V11H9v3h2v6.5h3V14h2.4l.6-3H14v-1.4c0-.6.3-1.1 1-1.1z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Added 15 Sep for POS's own footer (Kennedy: "add LinkedIn, TikTok &
 * YouTube to social footer icons. I'll add the actual links later") —
 * same inline-SVG, currentColor pattern as the three above; real brand
 * marks, not lucide placeholders.
 */
export function LinkedInIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7.2" cy="7.8" r="1.3" fill="currentColor" />
      <path d="M6 10.5h2.4V18H6v-7.5z" fill="currentColor" />
      <path
        d="M10.6 10.5H13v1.1c.5-.7 1.3-1.3 2.5-1.3 1.9 0 3 1.3 3 3.6V18h-2.4v-3.7c0-1-.4-1.7-1.4-1.7-.8 0-1.3.5-1.5 1.1-.1.2-.1.5-.1.8V18h-2.5v-7.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TikTokIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.5 3c.4 2.1 1.8 3.5 4 3.8v2.6c-1.4.1-2.8-.3-4-1.1v6.4c0 3.1-2.5 5.3-5.4 5.3-3 0-5.4-2.4-5.4-5.4 0-3 2.7-5.6 5.9-5.3v2.7c-1.5-.3-2.9.7-2.9 2.3 0 1.4 1.1 2.5 2.5 2.5 1.5 0 2.8-1.2 2.8-2.8V3h2.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function YouTubeIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="5.5" width="20" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.2 9.3v5.4l5-2.7-5-2.7z" fill="currentColor" />
    </svg>
  );
}
