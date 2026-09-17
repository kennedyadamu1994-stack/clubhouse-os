"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ModalPortal } from "./modal-portal";
import { PaginatedList } from "./paginated-list";

/**
 * The NBRH Engine — universal search across Activities, Clubs, Leagues,
 * Venues, Events, and People. Ported from a standalone HTML/JS tool
 * Kennedy already had built and running on thenbrh.co.uk, following the
 * same approach as components/session-insights.tsx: the real filtering,
 * sorting, and data-shaping logic is ported faithfully, restyled onto
 * this app's theme rather than shipping the original's own design system
 * alongside it.
 *
 * Data isn't club-scoped (every club sees the same platform-wide catalogue),
 * so this fetches directly from the same public opensheet.elk.sh endpoint
 * the original used, client-side — not through lib/data. See
 * lib/data/sheets.ts's own note on why session-insights.tsx and this
 * component are both deliberately kept off that adapter.
 *
 * The original manipulated the DOM directly and built onclick handlers as
 * HTML strings; that doesn't translate to React, so every interaction here
 * is a normal React event handler over the same underlying data model
 * (six categories, each with its own filter fields) rather than a literal
 * line-by-line port of the DOM code.
 */

/**
 * Real fix (17 Sep) — this was hardcoded to the WRONG spreadsheet the
 * entire time this file has existed: 1v2ve0B1MWKQPu0CRIgl4jhtHRk88MoEA04T6IfhPE_o,
 * confirmed by Kennedy NOT to be his real data sheet. The real one is
 * 1cEedP9_t6xvQ9pOAxPbb5L8piq-2Jl7GM87C51zJGB8. This is very likely
 * why credibility_score (added 17 Sep) never worked at all — it never
 * existed on the wrong sheet, regardless of column-name/parsing
 * correctness, which is why an extended live investigation (real
 * column name confirmed, real cell value confirmed as plain "3.4",
 * parseFloat logic verified correct in isolation) kept coming back
 * clean: every hypothesis about the DATA on the sheet being read was
 * being tested against the wrong sheet the whole time. It's plausible
 * this also explains any other Engine field that's ever seemed to
 * silently not work despite the code and the real master sheet both
 * looking correct.
 *
 * This ID was never wired to an environment variable the way every
 * other real sheet ID in this app is (GOOGLE_SHEET_ID_MASTER etc.) —
 * inconsistent with the rest of the codebase, and exactly the kind of
 * thing that let a wrong value sit unnoticed this long, since nothing
 * ever prompted anyone to check it against the real Vercel env vars.
 * Left as a literal string here rather than moved to a new env var in
 * this same fix, since the standalone widget's own original design
 * (predating this app entirely) already hardcoded this exact ID this
 * way, and opensheet.elk.sh is a public, unauthenticated, read-only
 * endpoint — genuinely different in kind from the real Google Sheets
 * API credentials every other real sheet ID in this app protects.
 */
const SHEET_ID = "1cEedP9_t6xvQ9pOAxPbb5L8piq-2Jl7GM87C51zJGB8";

const TAB_VISIBILITY: Record<Category, "Open" | "Closed"> = {
  Activities: "Open",
  Clubs: "Open",
  Leagues: "Open",
  Venues: "Open",
  Events: "Open",
  // Stays "Closed" as the base default — CHOS's own /tools/search page
  // (app/dashboard/[clubToken]/tools/search/page.tsx) renders this same
  // component and must keep exactly its current behaviour, unchanged
  // (Kennedy, 15 Sep: "CHOS needs to remain the same and untouched").
  // POS turns People on via the showPeople prop below instead of this
  // constant being edited directly, so the two surfaces can genuinely
  // differ without either affecting the other.
  People: "Closed",
};

/**
 * Real fix (17 Sep) — updated to the actual tab names on the correct
 * sheet (1cEedP9_t6xvQ9pOAxPbb5L8piq-2Jl7GM87C51zJGB8, see SHEET_ID's
 * own doc comment for the full story of how the wrong sheet ID was
 * found and fixed). Once SHEET_ID pointed at the right document, every
 * result went empty across both CHOS and POS — not because the ID fix
 * was wrong, but because this old sheet's tab names (CLUBS, VENUES,
 * Leagues, EVENTS, "Core Sessions") don't exist on the new one at all;
 * it uses genuinely different names (confirmed directly by Kennedy,
 * 17 Sep): SESSIONS (O), CLUBS (O), VENUES (O), LEAGUES (O), EVENTS
 * (O), and PEOPLE (People alone was already correct — the one name
 * that happens to match on both sheets).
 */
export const SHEET_TAB: Record<Category, string> = {
  Activities: "SESSIONS (O)",
  Clubs: "CLUBS (O)",
  Leagues: "LEAGUES (O)",
  Venues: "VENUES (O)",
  Events: "EVENTS (O)",
  People: "PEOPLE",
};

export type Category = "Activities" | "Clubs" | "Leagues" | "Venues" | "Events" | "People";
const ALL_CATEGORIES: Category[] = ["Activities", "Clubs", "Leagues", "Venues", "Events", "People"];
// The module-level "always CHOS's fixed set" constant this used to be
// was replaced by the per-render visibleCategories inside NbrhEngine
// (15 Sep, showPeople prop) — see that useMemo for the real logic now.

const CACHE_TTL_MS = 60 * 1000;
const SPECIAL_BADGES = ["New", "Trending", "Top 10 In NBRH"];
const FALLBACK_IMG = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop";

export type Row = Record<string, string>;

export interface Item {
  id: string;
  name: string;
  type: string;
  category: Category;
  location: string;
  address: string;
  price: number;
  basePrice: number;
  discount: number;
  priceText: string;
  image: string;
  additionalImages: string[];
  booking: string;
  website: string;
  description: string;
  confidenceScore: string;
  rating: number;
  /**
   * Real "credibility_score" column (17 Sep) — genuinely SEPARATE from
   * `rating` above, not a rename. `rating` is CHOS's own pre-existing
   * Search field (numeric_rating/rating/user_rating, varying by real
   * column name per category) — it's load-bearing throughout this
   * file already (min-rating filters, sort-by-rating, EngineCard's own
   * "9.2 • Excellent" overlay on Venues), so it stays exactly as-is,
   * untouched, for CHOS's own real Search page. credibilityScore is
   * Kennedy's newer, genuinely universal 1-5 half-point star system
   * (6 Sep, "a universal star system... represent the quality of the
   * data"), already used throughout CHOS's own Outreach pages via
   * StarRating (components/star-rating.tsx) — that component was
   * purpose-built for this exact field's scale/null-handling. POS's
   * own PlayerEntryCard/ForYouCard read THIS field for their stars
   * (17 Sep fix — Kennedy confirmed they'd been reading `rating`
   * instead, a real mismatch from CHOS's own universal system), never
   * `rating`. Null when the row genuinely has no credibility_score set
   * — StarRating already renders nothing for null, the same "absence
   * isn't a low score" principle used everywhere else this field
   * appears.
   */
  credibilityScore: number | null;
  verified: boolean;
  active: boolean;
  vibe: string;
  club: string;
  difficulty: string;
  ageGroup: string;
  audience: string;
  indoor: boolean;
  equipmentProvided: boolean;
  badge: string;
  sponsored: boolean;
  sessionType: string;
  spotsAvailable: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  sessionStatus: string;
  cancelHours: number;
  dayOfWeek: string;
  ctaText: string;
  clubHub: string;
  linkType: string;
  sport: string;
  skillLevel: string;
  ageGroups: string;
  competitiveOrSocial: string;
  borough: string;
  eventStartDate: string;
  eventEndDate: string;
  specialisation: string;
  availability: string;
  experienceYears: string;
  certifications: string;
  instagram: string;
  parking: string;
  courts: number;
  walkins: string;
  reviewCount: number;
  raw: Row;
}

const pn = (v: unknown) => {
  const n = parseFloat(String(v ?? ""));
  return isNaN(n) ? 0 : n;
};
/**
 * Like pn, but returns null on missing/invalid rather than 0 — used
 * only for credibility_score (17 Sep), which genuinely distinguishes
 * "not rated yet" (null, no stars shown) from a real low score, unlike
 * `rating` above, whose existing callers throughout this file already
 * treat 0 as its own valid "unrated" sentinel.
 */
const pnOrNull = (v: unknown) => {
  const n = parseFloat(String(v ?? ""));
  return isNaN(n) ? null : n;
};
const clean = (v: unknown) => String(v ?? "").trim();
const escapeAttr = (s: string) => s.replace(/'/g, "\u2019");

function uniqueSorted(values: (string | undefined)[]) {
  return Array.from(new Set(values.filter((v): v is string => !!v && v.trim() !== ""))).sort();
}

function getRatingClass(rating: number) {
  const r = Math.round(Math.max(0, Math.min(rating, 10)));
  if (r <= 2) return "sr-score-low";
  if (r <= 4) return "sr-score-orange";
  if (r <= 6) return "sr-score-amber";
  if (r <= 8) return "sr-score-green";
  return "sr-score-good";
}
function getRatingCaption(rating: number) {
  if (rating >= 9.6) return "GOATED";
  if (rating >= 9.1) return "Amazing";
  if (rating >= 8.6) return "Excellent";
  if (rating >= 8.0) return "Great";
  if (rating >= 7.0) return "Good";
  if (rating >= 6.0) return "Above Avg";
  if (rating >= 5.0) return "Average";
  return "Below Avg";
}
const CONFIDENCE_ORDER = ["Verified", "Likely Active", "Probably Active", "Uncertain", "Unconfirmed"];
function getConfidenceClass(label: string) {
  switch (label) {
    case "Verified":
      return "sr-conf-verified";
    case "Likely Active":
      return "sr-conf-likely";
    case "Probably Active":
      return "sr-conf-probably";
    case "Uncertain":
      return "sr-conf-uncertain";
    default:
      return "sr-conf-unconfirmed";
  }
}
function getConfidencePriority(label: string) {
  const i = CONFIDENCE_ORDER.indexOf(label);
  return i === -1 ? CONFIDENCE_ORDER.length : i;
}
function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr + "T12:00:00");
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}
function formatEventDate(dateStr: string) {
  const d = parseDateSafe(dateStr);
  if (!d) return dateStr;
  return `${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })} ${d.getFullYear()}`;
}

/**
 * Exported (15 Sep, POS Recommendations) — additive only, this
 * function's own fetch/cache/error logic is completely unchanged.
 * lib/players/for-you-scoring.ts (the real scoring-algorithm port that
 * replaced the earlier reason-chip lib/players/recommendations.ts,
 * since removed) reuses this rather than building a second client-side
 * fetch against the same opensheet.elk.sh endpoint, which would risk
 * drifting out of sync with this one (different caching behaviour,
 * different error handling) over time.
 */
export async function fetchTab(tabName: string): Promise<Row[]> {
  try {
    const cacheKey = `nbrh-engine:${SHEET_ID}:${tabName}`;
    const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      const { t, data } = JSON.parse(cached);
      if (Date.now() - t < CACHE_TTL_MS) return data;
    }
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(tabName)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data }));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
    return data;
  } catch {
    return [];
  }
}

function mapActivity(r: Row, i: number): Item {
  return {
    id: `activity_${i}`,
    name: r["Class Name"] || "Unnamed Activity",
    type: r["Activity Type"] || "Activity",
    category: "Activities",
    location: r["Location"] || "",
    address: r["Address"] || "",
    price: pn(r["Total Price"]),
    basePrice: pn(r["Base Price (£)"]),
    discount: pn(r["Discount"]),
    priceText: "",
    image: r["Image URL"] || FALLBACK_IMG,
    additionalImages: [],
    booking: r["Booking URL"] || "",
    website: r["Website"] || "",
    description: r["Notes"] || "",
    confidenceScore: clean(r["Confidence Score"]),
    rating: 0,
    credibilityScore: pnOrNull(r["credibility_score"]), // real fix (17 Sep) — SESSIONS (O) genuinely does have this column (confirmed directly by Kennedy), unlike the old stale "Core Sessions" tab, which didn't; this was still hardcoded to null from before the real sheet/tab names were known, the actual reason stars never showed for Activities even after the sheet-ID and tab-name fixes
    verified: r["Session Status"] === "General Access",
    active: true,
    vibe: r["Vibe"] || "",
    club: r["CLUB"] || "",
    difficulty: r["Difficulty Level"] || "",
    ageGroup: r["Age Group"] || "",
    audience: r["Audience"] || "",
    indoor: r["Indoor/Outdoor"] === "Indoor",
    equipmentProvided: r["Equipment Provided"] === "Yes",
    badge: r["Badge"] || "",
    sponsored: r["Sponsored"] === "Yes",
    sessionType: r["Type"] || "",
    spotsAvailable: pn(r["Spots Available"]),
    date: r["Date"] || "",
    startTime: r["Start Time"] || "",
    endTime: r["End Time"] || "",
    duration: pn(r["Duration (minutes)"]),
    sessionStatus: r["Session Status"] || "",
    cancelHours: pn(r["Cancellation Hours"]),
    dayOfWeek: r["Days"] || "",
    ctaText: r["Book/Easy Book"] || "BOOK NOW",
    clubHub: r["Club Hub URL"] || "",
    linkType: (r["IN/EX"] || "Internal").trim(),
    sport: "",
    skillLevel: "",
    ageGroups: "",
    competitiveOrSocial: "",
    borough: "",
    eventStartDate: "",
    eventEndDate: "",
    specialisation: "",
    availability: "",
    experienceYears: "",
    certifications: "",
    instagram: "",
    parking: "",
    courts: 0,
    walkins: "",
    reviewCount: pn(r["Review Count"]),
    raw: r,
  };
}
function mapClub(r: Row, i: number): Item {
  return {
    id: `club_${i}`,
    name: r.club_name || "Unnamed Club",
    type: r.activity_type || "Club",
    category: "Clubs",
    location: r.location || "",
    address: r.Address || "",
    price: pn(r.monthly_fee_amount),
    basePrice: 0,
    discount: 0,
    priceText: r.monthly_fee_text || "",
    image: r.image_url || FALLBACK_IMG,
    additionalImages: [],
    booking: r.page_url || r.booking_url || "",
    website: r.Website || "",
    description: r.club_snippet || r.club_bio || "",
    confidenceScore: "",
    rating: pn(r.numeric_rating),
    credibilityScore: pnOrNull(r.credibility_score),
    verified: r["Verified?"] === "yes",
    active: r.active === "yes",
    vibe: r.tags_vibe || "",
    club: "",
    difficulty: "",
    ageGroup: "",
    audience: r.audience || "",
    indoor: false,
    equipmentProvided: false,
    badge: "",
    sponsored: r["Sponsored"] === "Yes", // real "Sponsored" column (17 Sep, Kennedy confirmed CLUBS/Leagues/VENUES/PEOPLE all have this same real column, same Yes/No values as Activities') — was hardcoded false here, meaning every category except Activities silently never showed as sponsored regardless of the real sheet data
    sessionType: "",
    spotsAvailable: 0,
    date: "",
    startTime: "",
    endTime: "",
    duration: 0,
    sessionStatus: "",
    cancelHours: 0,
    dayOfWeek: "",
    ctaText: "",
    clubHub: "",
    linkType: "Internal",
    sport: "",
    skillLevel: "",
    ageGroups: "",
    competitiveOrSocial: "",
    borough: "",
    eventStartDate: "",
    eventEndDate: "",
    specialisation: "",
    availability: "",
    experienceYears: "",
    certifications: "",
    instagram: r.instagram || "",
    parking: "",
    courts: 0,
    walkins: "",
    reviewCount: 0,
    raw: r,
  };
}
function mapLeague(r: Row, i: number): Item {
  const c = mapClub(r, i);
  return {
    ...c,
    id: `league_${i}`,
    name: r.league_name || r.club_name || "Unnamed League",
    category: "Leagues",
    description: r.league_snippet || r.league_bio || r.club_snippet || r.club_bio || "",
    linkType: (r["IN/EX"] || "Internal").trim(),
  };
}
function mapVenue(r: Row, i: number): Item {
  return {
    ...mapClub(r, i),
    id: `venue_${i}`,
    name: r.venue_name || "Unnamed Venue",
    type: r.venue_type || "Venue",
    category: "Venues",
    location: r.borough || "",
    address: r.address_line_1 || "",
    price: pn(r.hourly_rate_min),
    image: r.hero_image_url || FALLBACK_IMG,
    booking: r.booking_url || "",
    website: r.website_url || "",
    description: r.venue_description_short || "",
    rating: pn(r.rating),
    verified: r.verified_by_nbrh === "yes",
    indoor: r.indoor_or_outdoor === "Indoor",
    vibe: r.vibe_tags || "",
    parking: r.parking_available || "",
    courts: pn(r.number_of_courts_or_pitches),
    walkins: r.walk_ins_allowed || "",
    linkType: (r["IN/EX"] || "Internal").trim(),
  };
}
function mapEvent(r: Row, i: number): Item {
  return {
    ...mapClub(r, i),
    id: `event_${i}`,
    name: r.event_name || "Unnamed Event",
    type: r.event_type || "Event",
    category: "Events",
    location: r.Location || r.location || "",
    borough: r.borough || "",
    address: r.address_line_1 || "",
    price: pn(r.price_amount),
    priceText: r.price_type || "",
    image: r.image_hero_url || FALLBACK_IMG,
    booking: r.booking_url || "",
    website: r.website_url || "",
    description: r.event_description_short || "",
    skillLevel: r.skill_level || "",
    vibe: r.vibe_tags || "",
    sport: r.primary_sport || "",
    ageGroups: r.age_groups || "",
    competitiveOrSocial: r.competitive_or_social || "",
    eventStartDate: r.event_start_date || "",
    eventEndDate: r.event_end_date || "",
    linkType: (r["IN/EX"] || "Internal").trim(),
  };
}
function mapPerson(r: Row, i: number): Item {
  return {
    ...mapClub(r, i),
    id: `person_${i}`,
    name: r.name || "Unnamed Professional",
    type: r.professional_type || "Professional",
    category: "People",
    location: r.location || "",
    address: "",
    price: pn(r.Price_Per_Hour || r.price_per_hour),
    image: r.image_url || FALLBACK_IMG,
    booking: r.booking_url || "",
    website: r.website || "",
    description: r.bio || "",
    rating: pn(r.user_rating),
    verified: r.verified === "yes",
    active: r.active === "yes",
    vibe: r.vibe || "",
    sport: r.primary_sport || "",
    experienceYears: r.experience_years || "",
    certifications: r.certifications || "",
    specialisation: r.specialisation || "",
    availability: r.availability || "",
    ageGroups: r.age_groups || "",
    reviewCount: pn(r.review_count),
    linkType: "Internal",
  };
}

/** Exported (15 Sep) — see fetchTab's own doc comment above for why. */
export const MAPPERS: Record<Category, (r: Row, i: number) => Item> = {
  Activities: mapActivity,
  Clubs: mapClub,
  Leagues: mapLeague,
  Venues: mapVenue,
  Events: mapEvent,
  People: mapPerson,
};

/**
 * Fetches one category's real, filtered items — fetchTab + the right
 * mapper + the exact same active/session-status filtering the main
 * fetch effect below applies (15 Sep, factored out so POS
 * Recommendations, lib/players/for-you-scoring.ts (the real scoring
 * engine, and lib/players/home-search.ts), reuses the real
 * filtering rules rather than risking a second, silently-diverging
 * copy of them — see the inline comment on the Clubs/Leagues/People
 * branch for the real bug history behind why this filtering exists at
 * all). The main component's own useEffect below now calls this too,
 * so there is exactly one copy of this logic, not two.
 */
export async function fetchCategoryItems(cat: Category): Promise<Item[]> {
  const rows = await fetchTab(SHEET_TAB[cat]);
  const mapper = MAPPERS[cat];
  let items = rows.map((r, i) => mapper(r, i));
  if (cat === "Activities") {
    items = items.filter((it) => it.sessionStatus === "General Access");
  } else if (cat === "Clubs" || cat === "Leagues" || cat === "People") {
    // Only these three sheets have a real `active` column in the source data
    // (matching the original standalone tool's own per-category filters).
    // Venues and Events don't have one — mapVenue/mapEvent both derive from
    // mapClub for convenience, which sets `active` from a column that simply
    // isn't present on those two sheets, so every row was reading as
    // `active: false` and silently getting filtered out here. That's why
    // Venues (and, less visibly, Events) never showed up in Search.
    items = items.filter((it) => it.active);
  }
  return items;
}

type SortKey = "default" | "confidence" | "priceLow" | "priceHigh" | "date" | "name";
type ViewMode = "carousel" | "list";

/**
 * Optional props, all defaulting to exactly CHOS's original standalone
 * behaviour when omitted (Kennedy, 15 Sep: CHOS's own /tools/search
 * page must stay unchanged) — see each prop's own note below.
 */
interface NbrhEngineProps {
  /** Which category is active on mount. Ignored (stays "Activities", the original hardcoded default) when linkBase isn't also given, since without real routes to switch between there's nothing meaningful to initialise to. */
  initialCategory?: Category;
  /**
   * Search term to start with, pre-filling the in-component search box
   * (15 Sep bug fix — Kennedy: "the home page search bar" and "the NBRH
   * Search Engine... are two different things," correctly flagging that
   * Home's own search form built a ?q= URL param that nothing on this
   * side ever actually read; the query was silently dropped every time
   * someone searched from Home). Optional and additive — CHOS's own
   * /tools/search page never passes this, so its search box still
   * starts empty exactly as before.
   */
  initialSearch?: string;
  /** Adds People to the visible tabs — CHOS's page passes nothing, so People stays hidden there exactly as before; POS's Search pages pass true (Kennedy, 15 Sep: People is one of Home's 8 search targets). */
  showPeople?: boolean;
  /** Removes Events from the visible tabs — CHOS's page passes nothing, so Events stays visible there exactly as before; POS's Search pages pass true (Kennedy's later request: "completely remove the events subsection in the search section of the POS" — Calendar, a separate feature reading real calendar entries, is untouched by this). */
  hideEvents?: boolean;
  /**
   * When given, category selection renders as a single real dropdown
   * (a <select>, navigating via `${linkBase}?category=<slug>` on
   * change) instead of a row of separate pill buttons or in-component
   * setCategory() state — this is the actual Search-into-real-pages
   * split Kennedy asked for, then refined (15 Sep: "instead of the
   * NBRH engine sections being the boxes, can they be in one singular
   * dropdown box? Also showing the amount of entries in each?"). A
   * query param, not a URL path segment (15 Sep rewrite) — Search was
   * originally a dynamic [category] route, which produced a genuine,
   * confirmed runtime 404 in production (a same-named dynamic segment
   * collided between the public and personal Search trees — Next.js
   * 15's build passes clean on this shape, only the live request
   * fails). Moving to a plain static page with a query param removes
   * the dynamic segment entirely, on both trees, so there's nothing
   * left to collide. Omitted entirely for CHOS's own page, which keeps
   * the original single-page in-component tab-switching behaviour
   * (a row of buttons, no dropdown, no counts) completely untouched.
   */
  linkBase?: string;
  /**
   * When given, replaces EngineCard entirely as the renderer for each
   * result — this is the real visual redesign Kennedy asked for
   * (15 Sep: "present the NBRH engine... like the CHOS," attaching a
   * screenshot of CHOS's own EntryCard-style rows). EngineCard is the
   * standalone widget's own original dark carousel-card design;
   * PlayerEntryCard (components/player-entry-card.tsx) is what POS
   * passes here instead — same underlying Item, a completely different
   * look, including the player-favourites heart. Omitted entirely for
   * CHOS's own page, which keeps rendering EngineCard exactly as
   * before — this is purely additive, not a change to EngineCard
   * itself or to what CHOS sees.
   */
  cardRenderer?: (item: Item) => React.ReactNode;
}

export const CATEGORY_SLUG: Record<Category, string> = {
  Activities: "activities",
  Clubs: "clubs",
  Leagues: "leagues",
  Venues: "venues",
  Events: "events",
  People: "people",
};

export function NbrhEngine(props: NbrhEngineProps = {}) {
  // Wraps the real implementation in its own internal Suspense boundary
  // (15 Sep) — NbrhEngineInner now calls useSearchParams() unconditionally
  // (see that component's own doc comment for the real bug this fixes),
  // and Next.js requires any component using that hook to sit under a
  // Suspense boundary. CHOS's own /tools/search page calls <NbrhEngine />
  // directly with no wrapper of its own, so the boundary has to live in
  // here rather than at every call site, keeping this component's own
  // external API — <NbrhEngine /> with the same optional props as
  // before — completely unchanged for CHOS.
  return (
    <Suspense fallback={<div className="sr-loading"><div className="sr-spin" /></div>}>
      <NbrhEngineInner {...props} />
    </Suspense>
  );
}

function NbrhEngineInner({ initialCategory, initialSearch, showPeople, hideEvents, linkBase, cardRenderer }: NbrhEngineProps) {
  const router = useRouter();
  const searchParamsLive = useSearchParams();
  const visibleCategories = useMemo(
    () => ALL_CATEGORIES.filter((c) => TAB_VISIBILITY[c] === "Open" || (c === "People" && showPeople)).filter((c) => !(c === "Events" && hideEvents)),
    [showPeople, hideEvents],
  );
  const [allData, setAllData] = useState<Partial<Record<Category, Item[]>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // category and search are now derived directly from the live URL via
  // useSearchParams() when linkBase is set, not from a one-time
  // useState initializer synced by a separate effect (15 Sep — the
  // previous prop-plus-sync-effect approach still left category stuck
  // on Activities even after a hard refresh at ?category=venues,
  // confirmed by checking dev tools directly: the URL updated, the raw
  // server HTML contained "venues", but the live rendered page never
  // reflected it and no console error explained why. Rather than keep
  // chasing the exact mechanism blind — every individual piece of the
  // old prop/state/effect chain checked out correct in isolation, which
  // pointed at some kind of hydration-timing mismatch this sandbox
  // can't directly observe or run to confirm — reading straight from
  // useSearchParams() removes the whole class of "server-passed prop
  // vs. client-computed initial state" mismatch entirely: there is no
  // separate client-side value to ever fall out of sync with the URL,
  // because the URL IS the value, on every render, always. initialCategory/
  // initialSearch props still exist for CHOS's benefit (linkBase unset
  // → falls back to them/"Activities", preserving that page's original
  // behaviour untouched) and as the very first paint's value before
  // useSearchParams can run on the client.
  const urlCategorySlug = linkBase ? searchParamsLive.get("category") : null;
  const urlCategory = urlCategorySlug
    ? (Object.entries(CATEGORY_SLUG).find(([, s]) => s === urlCategorySlug)?.[0] as Category | undefined)
    : undefined;
  const [category, setCategory] = useState<Category>(linkBase && initialCategory ? initialCategory : "Activities");
  const [search, setSearch] = useState(initialSearch ?? "");

  // Keeps `category`/`search` state in sync with the live URL — this
  // now reads from useSearchParams (urlCategory/urlQ below), not from
  // the initialCategory/initialSearch props, so it re-fires correctly
  // on every real navigation regardless of whatever caused the earlier
  // mismatch.
  const urlQ = linkBase ? (searchParamsLive.get("q") ?? "") : undefined;
  useEffect(() => {
    if (linkBase && urlCategory && urlCategory !== category) {
      setCategory(urlCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only urlCategory/linkBase should trigger this
  }, [urlCategory, linkBase]);

  useEffect(() => {
    if (linkBase && urlQ !== undefined && urlQ !== search) {
      setSearch(urlQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only urlQ/linkBase should trigger this, same reasoning as the category sync effect above
  }, [urlQ, linkBase]);
  const [sortKey, setSortKey] = useState<SortKey>("default");

  // Forced to "list" permanently when cardRenderer is given, not just
  // defaulted (15 Sep, Kennedy: carousel view "messes up the
  // formatting") — PlayerEntryCard (POS's own EntryCard-style row)
  // renders inside .entry-row, a full-width list row, never the
  // .sr-card 280px flex tile carousel mode assumes; there's no
  // meaningful carousel rendering of that shape at all, so the toggle
  // itself is hidden rather than left available to switch back into a
  // broken layout. CHOS's own page never passes cardRenderer, so its
  // toggle and default carousel behaviour are both completely
  // unaffected by this.
  const [viewMode, setViewMode] = useState<ViewMode>(cardRenderer ? "list" : "carousel");
  const [filters, setFilters] = useState<Record<string, string | boolean>>({});
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const entries = await Promise.all(
          visibleCategories.map(async (cat) => [cat, await fetchCategoryItems(cat)] as const),
        );
        if (!cancelled) setAllData(Object.fromEntries(entries) as Record<Category, Item[]>);
      } catch {
        if (!cancelled) setError("Could not load NBRH Engine data. Check your connection and try refreshing.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visibleCategories only ever changes with showPeople (a prop, not per-render), refetching on every render would be wrong
  }, [showPeople]);

  const data = allData?.[category] ?? [];

  const filterOptions = useMemo((): Record<string, string[]> => {
    if (category === "Activities") {
      const daysInData = new Set(data.map((c) => c.dayOfWeek).filter(Boolean));
      const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      return {
        act: uniqueSorted(data.map((c) => c.type)),
        loc: uniqueSorted(data.map((c) => c.location)),
        day: dayOrder.filter((d) => daysInData.has(d)),
        diff: uniqueSorted(data.map((c) => c.difficulty)),
        type: uniqueSorted(data.map((c) => c.sessionType)),
        vibe: uniqueSorted(data.map((c) => c.vibe)),
        age: uniqueSorted(data.map((c) => c.ageGroup)),
        audience: uniqueSorted(data.map((c) => c.audience)),
        dur: uniqueSorted(data.map((c) => (c.duration ? String(c.duration) : ""))).sort((a, b) => Number(a) - Number(b)),
      };
    }
    if (category === "Clubs" || category === "Leagues") {
      return {
        activity: uniqueSorted(data.map((c) => c.type)),
        location: uniqueSorted(data.map((c) => c.location)),
        audience: uniqueSorted(data.map((c) => c.audience)),
      };
    }
    if (category === "Venues") {
      return { borough: uniqueSorted(data.map((c) => c.location)), type: uniqueSorted(data.map((c) => c.type)) };
    }
    if (category === "Events") {
      return {
        type: uniqueSorted(data.map((c) => c.type)),
        sport: uniqueSorted(data.map((c) => c.sport)),
        skill: uniqueSorted(data.map((c) => c.skillLevel)),
        age: uniqueSorted(data.map((c) => c.ageGroups)),
        location: uniqueSorted(data.map((c) => c.location)),
        borough: uniqueSorted(data.map((c) => c.borough)),
      };
    }
    return {
      type: uniqueSorted(data.map((c) => c.type)),
      sport: uniqueSorted(data.map((c) => c.sport)),
      location: uniqueSorted(data.map((c) => c.location)),
      specialisation: uniqueSorted(data.map((c) => c.specialisation)),
      availability: uniqueSorted(data.map((c) => c.availability)),
      age: uniqueSorted(data.map((c) => c.ageGroups)),
    };
  }, [category, data]);

  function passesSearch(c: Item) {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const fields = [
      c.name, c.club, c.type, c.category, c.location, c.address, c.difficulty, c.vibe, c.ageGroup,
      c.audience, c.badge, c.description, c.sessionStatus, c.dayOfWeek, c.sessionType, c.sport,
      c.specialisation, c.certifications, c.ageGroups, c.availability, c.borough, c.competitiveOrSocial,
      c.skillLevel,
    ];
    return fields.some((f) => f && f.toLowerCase().includes(term));
  }

  function passesFilters(c: Item) {
    const f = filters;
    if (category === "Activities") {
      if (f.act && c.type !== f.act) return false;
      if (f.loc && c.location !== f.loc) return false;
      if (f.day && c.dayOfWeek !== f.day) return false;
      if (f.diff && c.difficulty !== f.diff) return false;
      const pmin = pn(f.pmin) || 0;
      const pmax = f.pmax ? pn(f.pmax) : Infinity;
      if (c.price < pmin || c.price > pmax) return false;
      if (f.spots && c.spotsAvailable <= 0) return false;
      if (f.type && c.sessionType !== f.type) return false;
      if (f.age && c.ageGroup !== f.age) return false;
      if (f.audience && c.audience !== f.audience) return false;
      if (f.dur && c.duration !== pn(f.dur)) return false;
      if (f.vibe && c.vibe !== f.vibe) return false;
      if (f.confidence && c.confidenceScore !== f.confidence) return false;
      if (f.equip && !c.equipmentProvided) return false;
      if (f.indoor && !c.indoor) return false;
      if (f.badge && !(c.badge && SPECIAL_BADGES.includes(c.badge))) return false;
      const canHours = pn(f.can) || 0;
      if (c.cancelHours < canHours) return false;
    } else if (category === "Clubs" || category === "Leagues") {
      if (f.activity && c.type !== f.activity) return false;
      if (f.location && c.location !== f.location) return false;
      if (f.audience && c.audience !== f.audience) return false;
      const minRating = pn(f.rating) || 0;
      if (c.rating < minRating) return false;
    } else if (category === "Venues") {
      if (f.borough && c.location !== f.borough) return false;
      if (f.type && c.type !== f.type) return false;
      if (f.parking && c.parking !== f.parking) return false;
      if (f.indoor && (c.raw?.indoor_or_outdoor || "") !== f.indoor) return false;
      const minCourts = pn(f.courts) || 0;
      if (c.courts < minCourts) return false;
      if (f.walkins && c.walkins !== "yes") return false;
      const rateMin = pn(f.rateMin) || 0;
      const rateMax = f.rateMax ? pn(f.rateMax) : Infinity;
      if (c.price < rateMin || c.price > rateMax) return false;
      const minRating = pn(f.rating) || 0;
      if (c.rating < minRating) return false;
    } else if (category === "Events") {
      if (f.type && c.type !== f.type) return false;
      if (f.sport && c.sport !== f.sport) return false;
      if (f.competitive && c.competitiveOrSocial !== f.competitive) return false;
      const priceMin = pn(f.priceMin) || 0;
      const priceMax = f.priceMax ? pn(f.priceMax) : Infinity;
      if (c.price < priceMin || c.price > priceMax) return false;
      if (f.skill && c.skillLevel !== f.skill) return false;
      if (f.age && c.ageGroups !== f.age) return false;
      if (f.location && c.location !== f.location) return false;
      if (f.borough && c.borough !== f.borough) return false;
      if (f.startDate && c.eventStartDate !== f.startDate) return false;
      if (f.endDate && c.eventEndDate !== f.endDate) return false;
    } else {
      if (f.type && c.type !== f.type) return false;
      if (f.sport && c.sport !== f.sport) return false;
      if (f.location && c.location !== f.location) return false;
      if (f.specialisation && c.specialisation !== f.specialisation) return false;
      const priceMin = pn(f.priceMin) || 0;
      const priceMax = f.priceMax ? pn(f.priceMax) : Infinity;
      if (c.price < priceMin || c.price > priceMax) return false;
      if (f.availability && c.availability !== f.availability) return false;
      if (f.age && c.ageGroups !== f.age) return false;
      const minRating = pn(f.rating) || 0;
      if (c.rating < minRating) return false;
    }
    return true;
  }

  const filtered = useMemo(() => data.filter((c) => passesSearch(c) && passesFilters(c)), [data, search, filters, category]);

  const sorted = useMemo(() => {
    const FAR = new Date("2099-12-31").getTime();
    const list = [...filtered];
    if (category === "Activities") {
      switch (sortKey) {
        case "priceLow":
          return list.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
        case "priceHigh":
          return list.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
        case "confidence":
          return list.sort(
            (a, b) => getConfidencePriority(a.confidenceScore) - getConfidencePriority(b.confidenceScore) || a.name.localeCompare(b.name),
          );
        case "date":
          return list.sort((a, b) => {
            const ta = parseDateSafe(`${a.date}T${a.startTime || "00:00"}`)?.getTime() ?? FAR;
            const tb = parseDateSafe(`${b.date}T${b.startTime || "00:00"}`)?.getTime() ?? FAR;
            return ta - tb || a.name.localeCompare(b.name);
          });
        case "name":
          return list.sort((a, b) => a.name.localeCompare(b.name));
        default:
          return list.sort((a, b) => {
            if (a.sponsored !== b.sponsored) return a.sponsored ? -1 : 1;
            const aS = a.badge && SPECIAL_BADGES.includes(a.badge);
            const bS = b.badge && SPECIAL_BADGES.includes(b.badge);
            if (aS !== bS) return aS ? -1 : 1;
            const ta = parseDateSafe(`${a.date}T${a.startTime || "00:00"}`)?.getTime() ?? FAR;
            const tb = parseDateSafe(`${b.date}T${b.startTime || "00:00"}`)?.getTime() ?? FAR;
            return ta - tb || getConfidencePriority(a.confidenceScore) - getConfidencePriority(b.confidenceScore) || a.name.localeCompare(b.name);
          });
      }
    }
    switch (sortKey) {
      case "priceLow":
        return list.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
      case "priceHigh":
        return list.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
      case "date":
        if (category === "Events") {
          return list.sort((a, b) => {
            const ta = parseDateSafe(a.eventStartDate)?.getTime() ?? FAR;
            const tb = parseDateSafe(b.eventStartDate)?.getTime() ?? FAR;
            return ta - tb || a.name.localeCompare(b.name);
          });
        }
        return list.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
      case "name":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        if (category === "Events") {
          return list.sort((a, b) => {
            const ta = parseDateSafe(a.eventStartDate)?.getTime() ?? FAR;
            const tb = parseDateSafe(b.eventStartDate)?.getTime() ?? FAR;
            return ta - tb || a.name.localeCompare(b.name);
          });
        }
        return list.sort((a, b) => {
          if (a.verified !== b.verified) return a.verified ? -1 : 1;
          return b.rating - a.rating || a.name.localeCompare(b.name);
        });
    }
  }, [filtered, sortKey, category]);

  function setFilter(key: string, value: string | boolean) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }
  function resetFilters() {
    setFilters({});
    setShowAdvanced(false);
  }
  const activeFilterCount = Object.values(filters).filter((v) => v && v !== "").length;

  if (error) {
    return (
      <div className="sr-card-hero">
        <span className="sr-lbl">Error</span>
        <p className="sr-body">{error}</p>
      </div>
    );
  }
  if (!allData) {
    return (
      <div className="sr-loading">
        <div className="sr-spin" />
        <p style={{ color: "var(--faint-text)", fontSize: "0.85rem" }}>Loading the NBRH Engine…</p>
      </div>
    );
  }

  return (
    <div className="sr-root">
      {linkBase ? (
        // POS: one real dropdown instead of a row of separate pill
        // buttons (15 Sep, Kennedy: "instead of the NBRH engine
        // sections being the boxes, can they be in one singular
        // dropdown box? Also showing the amount of entries in each?").
        // A real <select>, not a custom dropdown component — genuinely
        // simplest and most accessible for a single-choice list, and
        // native <select> options can't be styled individually beyond
        // plain text, which is why the count is appended as plain text
        // ("Clubs (124)") rather than a separate badge element the way
        // the removed pill buttons could show one.
        //
        // value MUST be CATEGORY_SLUG[category], not category itself
        // (15 Sep real bug fix — Kennedy: "I still can only access
        // activities on the search page"). category holds the real
        // Category value ("Clubs", "Leagues", capitalised), but every
        // <option value=...> below uses the lowercase slug ("clubs").
        // A controlled <select>'s value has to exactly match one of its
        // options' own value attributes; since "Clubs" never matched
        // "clubs", the browser fell back to showing whichever option
        // renders first in the DOM — Activities, always — regardless of
        // what category actually was. This was a distinct bug from the
        // earlier initialCategory-sync fix (that one is correct and
        // still in place above); the underlying state was updating
        // correctly the whole time, only this dropdown's own visual
        // binding to it was wrong.
        <select
          className="sr-category-select"
          value={CATEGORY_SLUG[category]}
          onChange={(e) => router.push(`${linkBase}?category=${e.target.value}`)}
        >
          {visibleCategories.map((cat) => (
            <option key={cat} value={CATEGORY_SLUG[cat]}>
              {cat} ({allData[cat]?.length ?? 0})
            </option>
          ))}
        </select>
      ) : (
        // CHOS: original in-component tab-switching, byte-for-byte
        // unchanged — this branch is exactly what ran before linkBase
        // existed, since CHOS's own /tools/search page never passes it.
        <div className="sr-category-tabs">
          {visibleCategories.map((cat) => (
            <button
              key={cat}
              className={`sr-category-tab ${category === cat ? "active" : ""}`}
              onClick={() => {
                setCategory(cat);
                resetFilters();
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="sr-toolbar">
        <div className="sr-search-wrap">
          <input
            type="text"
            className="sr-search-input"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="sr-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
        <div className="sr-btn-group">
          <button className={`sr-btn ${activeFilterCount > 0 ? "sr-btn-active" : ""}`} onClick={() => setFilterModalOpen(true)}>
            Filter {activeFilterCount > 0 && <span className="sr-filter-badge">{activeFilterCount}</span>}
          </button>
          <button className="sr-btn" onClick={() => setSortModalOpen(true)}>
            Sort
          </button>
          {/* Hidden entirely when cardRenderer is given (15 Sep) — there's no carousel rendering of PlayerEntryCard's row shape to toggle into at all, so showing a control that switches into a broken layout would be worse than no control. */}
          {!cardRenderer && (
            <button
              className={`sr-btn ${viewMode === "list" ? "sr-btn-active" : ""}`}
              onClick={() => setViewMode(viewMode === "carousel" ? "list" : "carousel")}
            >
              {viewMode === "carousel" ? "List view" : "Carousel view"}
            </button>
          )}
        </div>
        <div className="sr-result-count">
          {sorted.length} result{sorted.length !== 1 ? "s" : ""}
          {search.trim() && ` for "${search.trim()}"`}
        </div>
      </div>

      {cardRenderer ? (
        // POS: real "See more"/"See less" pagination (15 Sep, Kennedy:
        // "refer to the CHOS for the See More & See Less rules &
        // functionality") — reuses PaginatedList (components/
        // paginated-list.tsx) exactly as-is, the same component every
        // other plain list in this app already uses: 5 shown initially,
        // reveals 5 more per click, "See less" collapses back to 5.
        // PaginatedList owns its own visibleCount state internally and
        // remounts (via the key below) whenever the result set itself
        // changes — same reset-on-filter-change behaviour OutreachList's
        // own copy of this mechanic has, achieved here by giving
        // PaginatedList a fresh key instead of duplicating its internal
        // reset effect, since PaginatedList doesn't expose one to call.
        // CHOS's own /tools/search page never sets cardRenderer, so its
        // .sr-cards rendering below is completely unaffected — every
        // result still shows at once, exactly as before.
        <PaginatedListForSearch
          key={`${category}-${search}-${JSON.stringify(filters)}-${sortKey}`}
          items={sorted}
          cardRenderer={cardRenderer}
        />
      ) : (
        <div className={`sr-cards ${viewMode === "list" ? "sr-cards-list" : ""}`}>
          {sorted.length === 0 ? (
            <div className="sr-empty">
              <strong>No results found</strong>
              Try adjusting your search or filters.
            </div>
          ) : (
            sorted.map((c) => <EngineCard key={c.id} item={c} category={category} onDetails={() => setDetailItem(c)} />)
          )}
        </div>
      )}

      {filterModalOpen && (
        <FilterModal
          category={category}
          filters={filters}
          options={filterOptions}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          setFilter={setFilter}
          onReset={resetFilters}
          onClose={() => setFilterModalOpen(false)}
        />
      )}
      {sortModalOpen && (
        <SortModal
          category={category}
          sortKey={sortKey}
          onApply={(k) => {
            setSortKey(k);
            setSortModalOpen(false);
          }}
          onClose={() => setSortModalOpen(false)}
        />
      )}
      {detailItem && <DetailsModal item={detailItem} category={category} onClose={() => setDetailItem(null)} />}
    </div>
  );
}

/**
 * Wraps PaginatedList (components/paginated-list.tsx) for Search's own
 * cardRenderer results — handles the empty-state message itself (same
 * copy as the CHOS-branch's own .sr-empty block above) since
 * PaginatedList itself has no empty-state concept of its own, it just
 * renders whatever items array it's given.
 */
function PaginatedListForSearch({ items, cardRenderer }: { items: Item[]; cardRenderer: (item: Item) => React.ReactNode }) {
  if (items.length === 0) {
    return (
      <div className="sr-empty">
        <strong>No results found</strong>
        Try adjusting your search or filters.
      </div>
    );
  }
  return <PaginatedList items={items.map((c) => <div key={c.id}>{cardRenderer(c)}</div>)} className="entry-list" />;
}

function EngineCard({ item: c, category, onDetails }: { item: Item; category: Category; onDetails: () => void }) {
  const specialBadge = c.sponsored
    ? { text: "SPONSORED", className: "sr-badge-sponsored" }
    : c.badge === "New"
    ? { text: "NEW", className: "sr-badge-new" }
    : c.badge === "Trending"
    ? { text: "TRENDING", className: "sr-badge-trending" }
    : c.badge === "Top 10 In NBRH"
    ? { text: "TOP 10 IN NBRH", className: "sr-badge-top10" }
    : null;

  let priceNode: React.ReactNode;
  if (category === "Events") {
    priceNode = c.price === 0 ? <span className="sr-price sr-price-free">FREE</span> : <span className="sr-price">From £{c.price.toFixed(2)}</span>;
  } else if ((category === "Clubs" || category === "Leagues") && c.priceText) {
    priceNode = <span className="sr-price sr-price-club">{c.priceText}</span>;
  } else if (category === "People") {
    priceNode = (
      <>
        <span className={`sr-price ${c.price === 0 ? "sr-price-free" : ""}`}>{c.price === 0 ? "FREE" : `£${c.price.toFixed(2)}`}</span>
        <div className="sr-price-context">per hour</div>
      </>
    );
  } else if (category === "Venues") {
    priceNode = (
      <>
        <span className={`sr-price ${c.price === 0 ? "sr-price-free" : ""}`}>{c.price === 0 ? "FREE" : `£${c.price.toFixed(2)}`}</span>
        <div className="sr-price-context">per hour</div>
      </>
    );
  } else {
    priceNode =
      c.price === 0 ? (
        <span className="sr-price sr-price-free">FREE</span>
      ) : c.discount > 0 ? (
        <>
          <span className="sr-price-discount">£{c.basePrice.toFixed(2)}</span>
          <span className="sr-price">£{c.price.toFixed(2)}</span>
          <span className="sr-discount-badge">{Math.round(c.discount * 100)}% off</span>
        </>
      ) : (
        <span className="sr-price">£{c.price.toFixed(2)}</span>
      );
  }

  let statusOverlay: React.ReactNode = null;
  if (category === "Activities" && c.confidenceScore) {
    statusOverlay = <div className={`sr-status-overlay ${getConfidenceClass(c.confidenceScore)}`}>{c.confidenceScore}</div>;
  } else if (category === "Venues" && c.rating > 0) {
    statusOverlay = (
      <div className={`sr-status-overlay ${getRatingClass(c.rating)}`}>
        {c.rating.toFixed(1)} • {getRatingCaption(c.rating)}
      </div>
    );
  }

  const typeBadge = category !== "Activities" && category !== "Events" ? c.type || c.category : c.sessionType;
  const isExternal = c.linkType === "External";
  const ctaEnabled = !!c.booking;
  const ctaText = !ctaEnabled ? "UNAVAILABLE" : category === "Activities" ? (c.ctaText || "BOOK NOW").toUpperCase() : "LEARN MORE";

  let eventDateBadge: string | null = null;
  if (category === "Events" && c.eventStartDate) eventDateBadge = formatEventDate(c.eventStartDate);

  const description = c.description;
  const title = category === "Activities" && c.club ? `${c.name} • ${c.club}` : category === "People" && c.type ? `${c.name} • ${c.type}` : c.name;

  return (
    <div className="sr-card">
      <div className="sr-img-container">
        <div className="sr-badge-stack">
          {specialBadge && <span className={`sr-badge ${specialBadge.className}`}>{specialBadge.text}</span>}
          {eventDateBadge && <span className="sr-badge sr-badge-date">{eventDateBadge}</span>}
          {typeBadge && <span className="sr-badge sr-badge-type">{typeBadge}</span>}
        </div>
        {category !== "Activities" && (
          <button className="sr-info-icon" onClick={onDetails} aria-label="View details">
            i
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- external catalogue photos, not static assets */}
        <img className="sr-card-img" loading="lazy" src={c.image} alt={escapeAttr(c.name)} onError={(e) => (e.currentTarget.src = FALLBACK_IMG)} />
        <div className="sr-img-overlay">
          <div className="sr-price-container">{priceNode}</div>
          {statusOverlay}
        </div>
      </div>
      <div className="sr-card-content">
        <h3 className="sr-card-title">{title}</h3>
        {description && <p className="sr-card-notes">{description.length > 140 ? description.slice(0, 140) + "…" : description}</p>}
        <div className="sr-card-actions">
          {ctaEnabled ? (
            <a href={c.booking} target={isExternal ? "_blank" : undefined} rel="noopener noreferrer" className={`sr-btn-book ${isExternal ? "sr-btn-book-external" : ""}`}>
              {ctaText}
            </a>
          ) : (
            <button className="sr-btn-book" disabled>
              {ctaText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterModal({
  category,
  filters,
  options,
  showAdvanced,
  setShowAdvanced,
  setFilter,
  onReset,
  onClose,
}: {
  category: Category;
  filters: Record<string, string | boolean>;
  options: Record<string, string[]>;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  setFilter: (key: string, value: string | boolean) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const sel = (key: string) => (filters[key] as string) || "";
  const Select = ({ k, label, opts }: { k: string; label: string; opts: string[] }) => (
    <div className="field">
      <label>{label}</label>
      <select value={sel(k)} onChange={(e) => setFilter(k, e.target.value)}>
        <option value="">Any {label.toLowerCase()}</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal sr-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>Filter {category}</h2>

        {category === "Activities" && (
          <>
            <Select k="act" label="Activity/Type" opts={options.act ?? []} />
            <Select k="loc" label="Location" opts={options.loc ?? []} />
            <Select k="day" label="Day of Week" opts={options.day ?? []} />
            <Select k="diff" label="Difficulty" opts={options.diff ?? []} />
            <div className="field">
              <label>Price range £</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" placeholder="Min" min={0} value={sel("pmin")} onChange={(e) => setFilter("pmin", e.target.value)} style={{ width: "100%" }} />
                <input type="number" placeholder="Max" min={0} value={sel("pmax")} onChange={(e) => setFilter("pmax", e.target.value)} style={{ width: "100%" }} />
              </div>
            </div>
            <label className="checks" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <input type="checkbox" checked={!!filters.spots} onChange={(e) => setFilter("spots", e.target.checked)} />
              <span>Only show available classes</span>
            </label>
            <button className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)} style={btnToggleStyle}>
              Advanced filters {showAdvanced ? "▲" : "▼"}
            </button>
            {showAdvanced && (
              <>
                <Select k="type" label="Session Format" opts={options.type ?? []} />
                <Select k="vibe" label="Vibe" opts={options.vibe ?? []} />
                <Select k="age" label="Age Group" opts={options.age ?? []} />
                <Select k="audience" label="Audience" opts={options.audience ?? []} />
                <div className="field">
                  <label>Confidence</label>
                  <select value={sel("confidence")} onChange={(e) => setFilter("confidence", e.target.value)}>
                    <option value="">Any confidence</option>
                    {CONFIDENCE_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="checks" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <input type="checkbox" checked={!!filters.equip} onChange={(e) => setFilter("equip", e.target.checked)} />
                  <span>Equipment provided</span>
                </label>
                <label className="checks" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <input type="checkbox" checked={!!filters.indoor} onChange={(e) => setFilter("indoor", e.target.checked)} />
                  <span>Indoor only</span>
                </label>
                <label className="checks" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <input type="checkbox" checked={!!filters.badge} onChange={(e) => setFilter("badge", e.target.checked)} />
                  <span>Badge / Special classes</span>
                </label>
              </>
            )}
          </>
        )}

        {(category === "Clubs" || category === "Leagues") && (
          <>
            <Select k="activity" label="Activity Type" opts={options.activity ?? []} />
            <Select k="location" label="Location" opts={options.location ?? []} />
            <Select k="audience" label="Audience" opts={options.audience ?? []} />
          </>
        )}

        {category === "Venues" && (
          <>
            <Select k="borough" label="Borough" opts={options.borough ?? []} />
            <Select k="type" label="Venue Type" opts={options.type ?? []} />
            <button className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)} style={btnToggleStyle}>
              Advanced filters {showAdvanced ? "▲" : "▼"}
            </button>
            {showAdvanced && (
              <div className="field">
                <label>Minimum Courts/Pitches</label>
                <input type="number" min={0} value={sel("courts")} onChange={(e) => setFilter("courts", e.target.value)} />
              </div>
            )}
          </>
        )}

        {category === "Events" && (
          <>
            <Select k="type" label="Event Type" opts={options.type ?? []} />
            <Select k="sport" label="Primary Sport" opts={options.sport ?? []} />
            <div className="field">
              <label>Competitive or Social</label>
              <select value={sel("competitive")} onChange={(e) => setFilter("competitive", e.target.value)}>
                <option value="">Any</option>
                <option value="Competitive">Competitive</option>
                <option value="Social">Social</option>
              </select>
            </div>
            <button className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)} style={btnToggleStyle}>
              Advanced filters {showAdvanced ? "▲" : "▼"}
            </button>
            {showAdvanced && (
              <>
                <Select k="skill" label="Skill Level" opts={options.skill ?? []} />
                <Select k="age" label="Age Groups" opts={options.age ?? []} />
                <Select k="borough" label="Borough" opts={options.borough ?? []} />
              </>
            )}
          </>
        )}

        {category === "People" && (
          <>
            <Select k="type" label="Professional Type" opts={options.type ?? []} />
            <Select k="sport" label="Primary Sport" opts={options.sport ?? []} />
            <Select k="location" label="Location" opts={options.location ?? []} />
            <Select k="specialisation" label="Specialisation" opts={options.specialisation ?? []} />
            <Select k="availability" label="Availability" opts={options.availability ?? []} />
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button className="btn btn-black" style={{ flex: 1 }} onClick={onReset}>
            Reset
          </button>
          <button className="btn btn-pink" style={{ flex: 1 }} onClick={onClose}>
            Apply filters
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

const btnToggleStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  margin: "6px 0 14px",
  background: "transparent",
  border: "1px dashed var(--line-strong)",
  borderRadius: "var(--radius)",
  cursor: "pointer",
  fontSize: "0.68rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--faint-text)",
};

function SortModal({
  category,
  sortKey,
  onApply,
  onClose,
}: {
  category: Category;
  sortKey: SortKey;
  onApply: (k: SortKey) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState<SortKey>(sortKey);
  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal sr-modal" role="dialog" aria-modal="true">
        <h2>Sort by</h2>
        <div className="field">
          <select value={val} onChange={(e) => setVal(e.target.value as SortKey)}>
            <option value="default">Default (Featured → Date → Confidence)</option>
            {category === "Activities" && <option value="confidence">Confidence (Verified → Unconfirmed)</option>}
            <option value="priceLow">Price (low → high)</option>
            <option value="priceHigh">Price (high → low)</option>
            <option value="date">Date &amp; time (soonest)</option>
            <option value="name">Name (A → Z)</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="btn btn-black" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-pink" style={{ flex: 1 }} onClick={() => onApply(val)}>
            Apply
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

function DetailsModal({ item: c, category, onClose }: { item: Item; category: Category; onClose: () => void }) {
  const fv = (v: string | undefined, d = "N/A") => (v && v.trim() ? v : d);
  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal sr-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>{c.name}</h2>
        <div style={{ marginTop: 12 }}>
          <div className="cal-detail-row">
            <strong>Category:</strong> {c.category}
          </div>
          <div className="cal-detail-row">
            <strong>Type:</strong> {fv(c.type)}
          </div>
          <div className="cal-detail-row">
            <strong>Location:</strong> {fv(c.location)}
          </div>
          {c.address && (
            <div className="cal-detail-row">
              <strong>Address:</strong> {c.address}
            </div>
          )}
          {c.rating > 0 && (
            <div className="cal-detail-row">
              <strong>Rating:</strong> {c.rating.toFixed(1)} ⭐
            </div>
          )}
          {category === "Events" && c.eventStartDate && (
            <div className="cal-detail-row">
              <strong>Starts:</strong> {formatEventDate(c.eventStartDate)}
            </div>
          )}
          {category === "Events" && c.eventEndDate && (
            <div className="cal-detail-row">
              <strong>Ends:</strong> {formatEventDate(c.eventEndDate)}
            </div>
          )}
          {category === "Venues" && c.courts > 0 && (
            <div className="cal-detail-row">
              <strong>Courts/Pitches:</strong> {c.courts}
            </div>
          )}
          {c.instagram && (
            <div className="cal-detail-row">
              <strong>Instagram:</strong> {c.instagram}
            </div>
          )}
          <div className="cal-detail-row">
            <strong>Verified:</strong> {c.verified ? "Yes ✓" : "No"}
          </div>
        </div>
        {c.description && <p className="cal-detail-desc">{c.description}</p>}
        {c.website && (
          <a href={c.website} target="_blank" rel="noopener noreferrer" className="btn btn-black">
            Visit website
          </a>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
