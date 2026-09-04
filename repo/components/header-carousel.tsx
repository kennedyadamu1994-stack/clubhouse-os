"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeaderImage } from "@/lib/types";

interface HeaderCarouselProps {
  images: HeaderImage[];
  alt: string;
}

const AUTO_ADVANCE_MS = 15_000;

/**
 * Interactive header banner (Kennedy's request, 12 Aug): the single static
 * deck-banner photo becomes a carousel — manual prev/next + dot controls,
 * auto-advancing every 15s. Auto-advance pauses on hover/focus (so it never
 * fights a user mid-interaction) and is skipped entirely for
 * prefers-reduced-motion — the global reduced-motion rule in globals.css
 * only strips the CSS transition, it can't stop a setInterval, so that's
 * handled here in JS.
 *
 * No on-image text overlay or dark gradient (4 Sep, Kennedy: "ensure that
 * the carousel is clear and doesn't have the name of the club and the
 * sport in pink box... remove the transparent dark overlay at the
 * bottom") — clubName/tag props removed since nothing renders them
 * anymore; the accessible label (alt) still carries the same club/sport
 * context for screen readers even though it's no longer shown visually.
 *
 * Images now come from the real HEADER tab, CHOS Workspace (4 Sep,
 * Kennedy: "the header is not connected to the HEADER sheet... this was
 * in before and is no longer there") — real HeaderImage objects rather
 * than a flat string array, replacing the hardcoded DEMO_CAROUSEL_IMAGES
 * placeholder that stood in after an earlier hotlinked-image version
 * broke in production. Each slide becomes a real link when that row's
 * URL column is filled in; slides with no URL render as plain
 * (non-clickable) images, same as before this change.
 */
export function HeaderCarousel({ images, alt }: HeaderCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % images.length) + images.length) % images.length);
    },
    [images.length],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || paused || images.length <= 1) return;
    timerRef.current = setInterval(next, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, paused, images.length]);

  if (images.length === 0) return null;

  return (
    <div
      className="deck-banner deck-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
    >
      <div className="deck-carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {images.map((img, i) => {
          const isCurrent = i === index;
          const photo = (
            // eslint-disable-next-line @next/next/no-img-element -- external/per-club photo, not a static asset
            <img
              src={img.image_url}
              alt={isCurrent ? alt : ""}
              aria-hidden={isCurrent ? undefined : true}
              loading={i === 0 ? "eager" : "lazy"}
            />
          );
          return img.url ? (
            <a
              key={img.image_url + i}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={isCurrent ? undefined : -1}
              aria-hidden={isCurrent ? undefined : true}
            >
              {photo}
            </a>
          ) : (
            <div key={img.image_url + i}>{photo}</div>
          );
        })}
      </div>

      {images.length > 1 && (
        <>
          <button className="deck-carousel-arrow deck-carousel-prev" onClick={prev} aria-label="Previous image">
            ‹
          </button>
          <button className="deck-carousel-arrow deck-carousel-next" onClick={next} aria-label="Next image">
            ›
          </button>
          <div className="deck-carousel-dots" role="tablist" aria-label="Choose image">
            {images.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === index}
                aria-label={`Image ${i + 1} of ${images.length}`}
                className={`deck-carousel-dot ${i === index ? "active" : ""}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
