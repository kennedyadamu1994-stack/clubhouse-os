"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loginByEmail, getPlayerFavouritedKeysAction, getPlayerFavouritesAction } from "@/lib/players/actions";
import type { Player, FavouriteRow } from "@/lib/types";

/**
 * POS's email-based session (15 Sep, Kennedy's decision) — a separate
 * identity from the player's own private token link. Holds the logged-
 * in player's own real (ungated) profile in memory, persisted only as
 * the email itself in localStorage (matching the real recommendations
 * widget's own `localStorage.setItem('nbrh_email', email)` pattern),
 * so returning visitors are looked up again automatically rather than
 * having the full profile cached stale in the browser.
 *
 * This is intentionally lightweight — no server session, no cookie, no
 * expiry. Signing out just clears the stored email; signing back in is
 * always a fresh loginByEmail() lookup, so the data shown is never
 * older than the current page load.
 *
 * Also holds favouritedKeys (15 Sep) — one shared Set, fetched once per
 * email rather than once per card. This is what makes cardRenderer
 * (NbrhEngineProps, components/nbrh-engine.tsx) workable: EngineCard's
 * own render loop calls a plain function per item with no way to await
 * an async lookup inline, so PlayerFavouriteHeart reads its initial
 * saved state from here (context) instead of needing it threaded in as
 * a prop through that function boundary. refreshFavourites lets a
 * heart's own toggle update this shared set immediately, so every card
 * showing the same item elsewhere on the page reflects the change too.
 *
 * favouritesRows (15 Sep) is the same idea but with the FULL saved
 * snapshot (title/subtitle/href), not just category:item_id keys — the
 * Favourites page itself (app/players/favourites/page.tsx) needs this
 * to actually display what was saved, which favouritedKeys alone can't
 * do. Both are refreshed together by the same refreshFavourites call.
 */
const STORAGE_KEY = "nbrh_player_email";

interface PlayerSessionValue {
  player: Player | null;
  email: string | null;
  loading: boolean;
  error: string | null;
  favouritedKeys: Set<string>;
  favouritesRows: FavouriteRow[];
  login: (email: string) => Promise<boolean>;
  signOut: () => void;
  refreshFavourites: () => Promise<void>;
}

const PlayerSessionContext = createContext<PlayerSessionValue | null>(null);

export function PlayerSessionProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favouritedKeys, setFavouritedKeys] = useState<Set<string>>(new Set());
  const [favouritesRows, setFavouritesRows] = useState<FavouriteRow[]>([]);

  const refreshFavourites = useCallback(async () => {
    if (!email) {
      setFavouritedKeys(new Set());
      setFavouritesRows([]);
      return;
    }
    const [keys, rows] = await Promise.all([
      getPlayerFavouritedKeysAction(email),
      getPlayerFavouritesAction(email),
    ]);
    setFavouritedKeys(new Set(keys));
    setFavouritesRows(rows);
  }, [email]);

  const login = useCallback(async (rawEmail: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const result = await loginByEmail(rawEmail);
    if (!result.ok || !result.player) {
      setError(result.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return false;
    }
    setPlayer(result.player);
    setEmail(rawEmail.trim().toLowerCase());
    try {
      localStorage.setItem(STORAGE_KEY, rawEmail.trim().toLowerCase());
    } catch {
      /* storage unavailable — session still works for this page load */
    }
    setLoading(false);
    return true;
  }, []);

  const signOut = useCallback(() => {
    setPlayer(null);
    setEmail(null);
    setError(null);
    setFavouritedKeys(new Set());
    setFavouritesRows([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — nothing to clear */
    }
  }, []);

  // Auto-login on return, mirroring the real widget's own init() behaviour.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
    if (saved) {
      login(saved).then((ok) => {
        if (!ok) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            /* storage unavailable */
          }
        }
      });
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount only, same as the real widget's own init()
  }, []);

  // Fetches favourited keys + rows once whenever the logged-in email changes.
  useEffect(() => {
    refreshFavourites();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshFavourites itself already depends on [email], re-running whenever this effect's own email dependency changes would just call the same fresh closure twice
  }, [email]);

  return (
    <PlayerSessionContext.Provider
      value={{ player, email, loading, error, favouritedKeys, favouritesRows, login, signOut, refreshFavourites }}
    >
      {children}
    </PlayerSessionContext.Provider>
  );
}

export function usePlayerSession(): PlayerSessionValue {
  const ctx = useContext(PlayerSessionContext);
  if (!ctx) throw new Error("usePlayerSession must be used within a PlayerSessionProvider");
  return ctx;
}
