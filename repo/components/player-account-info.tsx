import type { Player } from "@/lib/types";

/**
 * Demographics + account data (15 Sep, Kennedy: "add more account data
 * as a drop down for the person that signs in" / "replace demographics
 * ... perhaps everything in drop downs"). Two small display components,
 * both reading the already-logged-in player's real profile
 * (usePlayerSession's own `player`, passed in as a prop by Home rather
 * than each of these calling the hook itself, since Home already knows
 * whether someone's logged in before deciding whether to render either
 * section at all) — read-only, no editing; Kennedy didn't ask for the
 * ability to change this data, just to see more of it.
 */
export function DemographicsGrid({ player }: { player: Player }) {
  const rows: { label: string; value: string }[] = [
    { label: "Home borough", value: player.area || "—" },
    { label: "Experience level", value: player.level || "—" },
    { label: "Gender", value: player.gender ?? "—" },
    { label: "Age", value: player.age != null ? String(player.age) : "—" },
    { label: "Availability", value: player.preferred_times || "—" },
  ];

  return (
    <div className="demographics-grid">
      {rows.map((r) => (
        <div key={r.label} className="demographics-item">
          <span className="demographics-item-label">{r.label}</span>
          <span className="demographics-item-value">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AccountDataGrid({ player, email }: { player: Player; email: string }) {
  const rows: { label: string; value: string }[] = [
    { label: "Email", value: email },
    { label: "Favourite sport", value: player.sports[0] || "—" },
    { label: "Other interests", value: player.interests.length ? player.interests.join(", ") : "—" },
    { label: "Member since", value: player.created_at || "—" },
  ];

  return (
    <div className="account-dropdown-grid">
      {rows.map((r) => (
        <div key={r.label} className="demographics-item">
          <span className="demographics-item-label">{r.label}</span>
          <span className="demographics-item-value">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
