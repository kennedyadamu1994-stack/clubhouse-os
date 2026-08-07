"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, FeatureGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * The NBRH Map — an interactive Leaflet map of sessions across London.
 * Ported from a standalone HTML/JS/Leaflet tool, following the same
 * approach as components/nbrh-engine.tsx and session-insights.tsx: real
 * data-shaping and interaction logic ported faithfully, restyled onto
 * this app's theme.
 *
 * DIFFERENT data source from every other ported tool in this app: this
 * one calls a Google Apps Script web app URL (DATA_URL below), not the
 * opensheet.elk.sh endpoint Session Insights and the Search engine use.
 * Apps Script endpoints are tied to a specific deployment and can behave
 * differently under load or once redeployed — worth knowing if this ever
 * stops returning data and the others still work fine.
 *
 * Leaflet needs `window`/`document` and must never run during SSR — this
 * component is dynamically imported with `ssr: false` from the page
 * (see app/dashboard/[clubToken]/tools/map/page.tsx), and Leaflet itself
 * is only ever touched inside useEffect, never at module top-level render.
 */

const DATA_URL = "https://script.google.com/macros/s/AKfycbxTED00BSZ2a1WVFUHdL9Tv2klq5c3LFnLeNC8cljY_-GIhqLDSgbIubzZ1gdsx7Tpc/exec";

const DEFAULT_CENTER: [number, number] = [51.5074, -0.1278];
const DEFAULT_ZOOM = 11;
const MIN_ZOOM = 9;
const MAX_ZOOM = 18;
const MARKER_CLUSTER_THRESHOLD = 100;
const MAX_EVENTS = 500;

const SPORT_ICON: Record<string, string> = {
  Basketball: "🏀", Football: "⚽", Volleyball: "🏐", Tennis: "🎾", Yoga: "🧘",
  Running: "🏃", Cycling: "🚴", Swimming: "🏊", Rugby: "🏉", Badminton: "🏸",
  Boxing: "🥊", Climbing: "🧗", Dance: "💃", Fitness: "💪", Gym: "🏋️",
  Hockey: "🏒", "Martial Arts": "🥋", MMA: "🥊", Padel: "🎾", Pilates: "🧘‍♀️",
  Rounders: "⚾", Skateboarding: "🛹", Squash: "🎾", "Table Tennis": "🏓",
  Taekwondo: "🥋",
};
const sportIcon = (s: string) => SPORT_ICON[s] || "📍";

interface Session {
  name: string;
  sport: string;
  lat: number;
  lng: number;
  status: string;
  location: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  basePrice: string;
  bookingURL: string;
  sessionID: string;
}

function parseUkDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}
function formatDayName(date: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", { weekday: "long" }) + "s";
}
function isValidCoords(lat: number, lng: number) {
  return typeof lat === "number" && typeof lng === "number" && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !isNaN(lat) && !isNaN(lng);
}

function processRows(rawData: Row[]): Session[] {
  if (!Array.isArray(rawData)) return [];
  return rawData
    .filter((r) => {
      if (!r["Class Name"] || !r["Activity Type"] || !r["Latitude"] || !r["Longitude"] || !r["Session Status"] || !r["Date"] || !r["Start Time"]) {
        return false;
      }
      const lat = Number(r["Latitude"]);
      const lng = Number(r["Longitude"]);
      if (!isValidCoords(lat, lng)) return false;
      if (r["Session Status"] !== "General Access") return false;
      const d = parseUkDate(r["Date"]);
      return !!d;
    })
    .map((r) => ({
      name: r["Class Name"],
      sport: r["Activity Type"],
      lat: Number(r["Latitude"]),
      lng: Number(r["Longitude"]),
      status: r["Session Status"],
      location: r["Location"] || "",
      address: r["Address"] || "",
      date: r["Date"],
      startTime: r["Start Time"],
      endTime: r["End Time"] || "",
      basePrice: r["Base Price (£)"] != null ? String(r["Base Price (£)"]) : "",
      bookingURL: r["Booking URL"] || "",
      sessionID: r["NBRH ID"] || "",
    }))
    .slice(0, MAX_EVENTS);
}

type Row = Record<string, string>;

function groupByLocation(sessions: Session[]) {
  const grouped = new Map<string, Session[]>();
  sessions.forEach((s) => {
    const key = `${s.lat.toFixed(6)},${s.lng.toFixed(6)}`;
    const list = grouped.get(key) ?? [];
    list.push(s);
    grouped.set(key, list);
  });
  grouped.forEach((list) => list.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)));
  return grouped;
}

export function NbrhMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<FeatureGroup | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [sportFilter, setSportFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Session[] | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Fetch data once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(DATA_URL, { headers: { Accept: "application/json" }, cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid data format");
        if (!cancelled) setAllSessions(processRows(data));
      } catch {
        if (!cancelled) setError("Could not load map data. Check your connection and try refreshing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialise the Leaflet map once, client-side only
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    let map: LeafletMap;
    (async () => {
      const L = await import("leaflet");
      map = L.map(mapRef.current!, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: MAX_ZOOM,
      }).addTo(map);
      markersLayerRef.current = L.featureGroup().addTo(map);
      leafletMapRef.current = map;
      setMapReady(true);
    })();
    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = allSessions;
    if (sportFilter !== "all") list = list.filter((s) => s.sport.toLowerCase() === sportFilter.toLowerCase());
    if (search.trim().length >= 2) {
      const term = search.toLowerCase();
      list = list.filter((s) => `${s.name} ${s.location} ${s.address}`.toLowerCase().includes(term));
    }
    return list;
  }, [allSessions, sportFilter, search]);

  const sports = useMemo(() => Array.from(new Set(allSessions.map((s) => s.sport))).sort(), [allSessions]);

  // Redraw markers whenever the filtered set or map readiness changes
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !markersLayerRef.current) return;
    let cleanup: (() => void) | undefined;
    (async () => {
      const L = await import("leaflet");
      const layer = markersLayerRef.current!;
      layer.clearLayers();

      if (filtered.length === 0) return;

      const grouped = groupByLocation(filtered);
      const markers: Marker[] = [];

      grouped.forEach((sessions) => {
        const first = sessions[0];
        const uniqueSports = new Set(sessions.map((s) => s.sport));
        const icon = uniqueSports.size > 1 ? "📍" : sportIcon(first.sport);
        const label =
          sessions.length > 1
            ? `${icon}<span style="position:absolute;bottom:-2px;right:-2px;background:#ff1b6e;color:#fff;border-radius:50%;width:18px;height:18px;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:bold;">${sessions.length}</span>`
            : icon;

        const customIcon = L.divIcon({
          className: "nbrh-map-marker",
          html: label,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        });

        const marker = L.marker([first.lat, first.lng], { icon: customIcon, title: first.location || "Session" });
        marker.on("click", () => setSelected(sessions));
        markers.push(marker);
        layer.addLayer(marker);
      });

      if (markers.length > MARKER_CLUSTER_THRESHOLD) {
        // Clustering is a rare-path optimisation (>100 distinct locations) — load the
        // plugin lazily via CDN script tag, same as the original tool, rather than
        // bundling it for every user who will never hit this threshold.
        await loadMarkerClusterPlugin();
      }

      if (leafletMapRef.current && layer.getLayers().length > 0) {
        const bounds = layer.getBounds();
        if (bounds.isValid()) leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    })();
    return () => cleanup?.();
  }, [filtered, mapReady]);

  return (
    <div className="nbmap-root">
      <div className="nbmap-toolbar">
        <select className="nbmap-select" value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} aria-label="Filter by sport">
          <option value="all">All sports</option>
          {sports.map((s) => (
            <option key={s} value={s}>
              {s} ({allSessions.filter((x) => x.sport === s).length})
            </option>
          ))}
        </select>
        <div className="nbmap-search-wrap">
          <input
            type="text"
            className="nbmap-search-input"
            placeholder="Search by name, location, or address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="nbmap-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
        <span className="nbmap-result-count">
          {loading ? "Loading…" : filtered.length === 0 ? "No sessions found" : `Showing ${filtered.length} session${filtered.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="nbmap-map-wrap">
        <div ref={mapRef} className="nbmap-map" />
        {loading && (
          <div className="nbmap-overlay">
            <div className="nbmap-spin" />
            <div>Loading sessions…</div>
          </div>
        )}
        {error && !loading && (
          <div className="nbmap-overlay">
            <div>{error}</div>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="nbmap-empty">
            <div style={{ fontSize: 40 }}>🏀</div>
            <div style={{ fontWeight: 600, marginTop: 8 }}>No sessions available</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters or search.</div>
          </div>
        )}
      </div>

      {selected && <SessionPopup sessions={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function SessionPopup({ sessions, onClose }: { sessions: Session[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const s = sessions[index];
  const date = parseUkDate(s.date);
  const dayLabel = formatDayName(date);
  const timeRange = s.startTime ? (s.endTime ? `${s.startTime} - ${s.endTime}` : s.startTime) : "Time TBA";
  const priceNum = parseFloat(s.basePrice);
  const priceLabel = !s.basePrice ? "Price TBA" : isNaN(priceNum) ? s.basePrice : priceNum === 0 ? "Free" : `£${priceNum}`;
  const hasBooking = !!s.bookingURL;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal sr-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>{sessions.length > 1 ? `${sessions.length} sessions at this location` : s.location || "This location"}</h2>

        {s.address && (
          <p style={{ fontSize: "0.82rem", color: "var(--dim)", marginBottom: 10 }}>
            {s.address}{" "}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--pink)" }}
            >
              Get directions →
            </a>
          </p>
        )}

        {sessions.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, margin: "10px 0", paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
            <button className="btn btn-black" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))} aria-label="Previous session">
              ←
            </button>
            <span style={{ fontSize: "0.82rem", color: "var(--dim)" }}>
              {index + 1} of {sessions.length}
            </span>
            <button className="btn btn-black" disabled={index === sessions.length - 1} onClick={() => setIndex((i) => Math.min(sessions.length - 1, i + 1))} aria-label="Next session">
              →
            </button>
          </div>
        )}

        <h3 style={{ fontSize: "1.05rem", marginBottom: 10 }}>{s.name}</h3>
        <div className="cal-detail-row">
          <strong>{sportIcon(s.sport)}</strong> {s.sport}
        </div>
        <div className="cal-detail-row">
          <strong>When:</strong> {dayLabel}, {timeRange}
        </div>
        <div className="cal-detail-row">
          <strong>Price:</strong> {priceLabel}
        </div>

        <div style={{ marginTop: 16 }}>
          {hasBooking ? (
            <a href={s.bookingURL} className="btn btn-pink" style={{ width: "100%", justifyContent: "center", display: "flex" }}>
              Book now →
            </a>
          ) : (
            <button className="btn btn-black" disabled style={{ width: "100%" }}>
              Booking unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function loadMarkerClusterPlugin(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { L?: { markerClusterGroup?: unknown } }).L?.markerClusterGroup) {
      resolve();
      return;
    }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
    document.head.appendChild(css);
    const cssDefault = document.createElement("link");
    cssDefault.rel = "stylesheet";
    cssDefault.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";
    document.head.appendChild(cssDefault);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load marker cluster plugin"));
    document.head.appendChild(script);
  });
}
