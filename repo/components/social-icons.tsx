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
