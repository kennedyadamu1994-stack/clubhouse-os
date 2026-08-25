/**
 * Fallback header banner images by sport, used only when a club's
 * header_image_url is blank (docs/schema.md). Kennedy can override any
 * club's banner directly in the Clubs sheet — this is a sensible default,
 * never the only option, and never assumes every club plays football.
 */
const FALLBACKS: Record<string, string> = {
  football: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1600&auto=format&fit=crop",
  netball: "https://images.unsplash.com/photo-1519861155730-0b5fbf0dd889?q=80&w=1600&auto=format&fit=crop",
  basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1600&auto=format&fit=crop",
  cricket: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1600&auto=format&fit=crop",
  rugby: "https://images.unsplash.com/photo-1544298621-35a4e12e3a17?q=80&w=1600&auto=format&fit=crop",
  running: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1600&auto=format&fit=crop",
};

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1600&auto=format&fit=crop";

export function headerImageFor(sport: string, headerImageUrl: string | null): string {
  if (headerImageUrl) return headerImageUrl;
  return FALLBACKS[sport.toLowerCase()] ?? DEFAULT_FALLBACK;
}

/**
 * Demo set for the header carousel. Now bundled SVG files served from
 * /public/banners rather than external Unsplash hotlinks — the earlier
 * hotlinked photos broke in production (a hotlinked Unsplash URL can fail
 * if the photo is deleted, its ID changes, or the CDN rate-limits, all
 * outside our control). These are self-contained on-brand graphics that
 * render identically everywhere and can never break. When Kennedy has real
 * per-club photos, drop them into /public/banners and swap this array (the
 * carousel component already handles any array length, including 1).
 */
export const DEMO_CAROUSEL_IMAGES: string[] = [
  "/banners/banner-01.svg",
  "/banners/banner-02.svg",
  "/banners/banner-03.svg",
  "/banners/banner-04.svg",
  "/banners/banner-05.svg",
];
