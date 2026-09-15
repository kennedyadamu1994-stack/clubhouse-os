"use client";

import { logoutAction } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => logoutAction()}
      style={{
        background: "none",
        border: "1px solid var(--line-strong)",
        borderRadius: "var(--radius)",
        padding: "6px 12px",
        fontSize: "0.8rem",
        color: "var(--dim)",
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
