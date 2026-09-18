"use client";

import { useEffect, useRef } from "react";
import { usePlayerSession } from "./player-session";
import { ForYouView } from "./for-you-view";

/**
 * Token'd-tree wrapper around ForYouView (15 Sep) — a player on their
 * own /players/[playerToken]/... pages already has a known identity
 * (their real email, from getPlayerByToken), so making them type it
 * in again for "For You" specifically would be a worse experience than
 * the old token-only version had. This auto-calls the email session's
 * own login() once with the known email, then renders the exact same
 * ForYouView everyone else uses — if that email doesn't resolve for
 * some reason (e.g. it changed on the sheet since this token was
 * issued), ForYouView's own signed-out state points to Home instead of
 * a broken/duplicate form, so nothing breaks silently.
 */
export function ForYouViewAuto({ knownEmail }: { knownEmail: string | null }) {
  const { player, login } = usePlayerSession();
  const attempted = useRef(false);

  useEffect(() => {
    if (player || attempted.current || !knownEmail) return;
    attempted.current = true;
    login(knownEmail);
  }, [player, knownEmail, login]);

  return <ForYouView />;
}
