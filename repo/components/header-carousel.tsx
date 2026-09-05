"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CarouselSlide {
  image_url: string;
  /** Optional click-through — wraps the slide in a link when present. Opens in a new tab since it's an outbound destination, not part of the app's own navigation. */
  url: string | null;
}

interface HeaderCarouselProps {
  slides: CarouselSlide[];
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
 * The club name + sport badge overlay (deck-banner-tag) that used to sit
 * over the image is removed entirely (Kennedy's request, 2 Sep, with
 * screenshot) — the carousel is now just the images themselves, no text
 * or pink badge on top. Slides now come from HeaderImage records (the
 * real "HEADER" tab on CHOS Workspace, wired 2 Sep — see
 * lib/data/sheets.ts's getHeaderImages) rather than a plain string array,
 * so each slide can carry its own optional click-through link.
 */
export function HeaderCarousel({ slides, alt }: HeaderCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || paused || slides.length <= 1) return;
    timerRef.current = setInterval(next, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, paused, slides.length]);

  if (slides.length === 0) return null;

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
        {slides.map((slide, i) => {
          // eslint-disable-next-line @next/next/no-img-element -- external/per-club photo, not a static asset
          const img = (
            <img
              src={slide.image_url}
              alt={i === index ? alt : ""}
              aria-hidden={i === index ? undefined : true}
              loading={i === 0 ? "eager" : "lazy"}
            />
          );
          return (
            <div className="deck-carousel-slide" key={slide.image_url + i}>
              {slide.url ? (
                <a href={slide.url} target="_blank" rel="noopener noreferrer" tabIndex={i === index ? 0 : -1}>
                  {img}
                </a>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button className="deck-carousel-arrow deck-carousel-prev" onClick={prev} aria-label="Previous image">
            ‹
          </button>
          <button className="deck-carousel-arrow deck-carousel-next" onClick={next} aria-label="Next image">
            ›
          </button>
          <div className="deck-carousel-dots" role="tablist" aria-label="Choose image">
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === index}
                aria-label={`Image ${i + 1} of ${slides.length}`}
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
