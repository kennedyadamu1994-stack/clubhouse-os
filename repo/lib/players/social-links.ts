import { LinkedInIcon, TikTokIcon, YouTubeIcon, type ExtraSocialLink } from "@/components/social-icons";

/**
 * POS's own extra social icons (15 Sep, Kennedy: "add LinkedIn, TikTok
 * & YouTube to social footer icons... for the POS"). href="#"
 * placeholders — Kennedy said he'd add the real links later; defined
 * once here and imported by both POS layouts ((browse) and
 * [playerToken]) rather than duplicating the same array in each.
 */
export const POS_EXTRA_SOCIAL_LINKS: ExtraSocialLink[] = [
  { label: "LinkedIn", href: "#", Icon: LinkedInIcon },
  { label: "TikTok", href: "#", Icon: TikTokIcon },
  { label: "YouTube", href: "#", Icon: YouTubeIcon },
];
