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
