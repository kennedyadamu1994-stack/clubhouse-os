"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HeaderCarouselProps {
  images: string[];
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
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- external/per-club photo, not a static asset
          <img
            key={src + i}
            src={src}
            alt={i === index ? alt : ""}
            aria-hidden={i === index ? undefined : true}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
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
