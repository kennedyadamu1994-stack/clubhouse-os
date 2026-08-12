"use client";

import { useState } from "react";
import { ActionPopup } from "./action-popup";

interface ServiceCardProps {
  clubToken: string;
  club_id: string;
  serviceId: string;
  name: string;
  categoryLabel: string;
  description: string;
  hourlyRateGbp: number;
  isFirstTokenEncounter: boolean;
}

/**
 * Services (spec.md § 4.5, docs/sections/03-05 § Section 5): "Cards from the
 * `Services` sheet: name, category, description, hourly_rate_gbp displayed
 * prominently." Deliberately its own component rather than a reuse of
 * EntryCard — EntryCard is a horizontal row built for a searchable/sortable
 * outreach LIST (avatar, match score, GDPR detail toggle); a service has
 * none of that, it's a catalogue tile. Still reuses ActionPopup (the same
 * shared modal every other action in the platform uses) for the actual
 * enquiry, passed a single pink option — "get in touch", always free.
 */
export function ServiceCard({
  clubToken,
  club_id,
  serviceId,
  name,
  categoryLabel,
  description,
  hourlyRateGbp,
  isFirstTokenEncounter,
}: ServiceCardProps) {
  const [popupOpen, setPopupOpen] = useState(false);

  return (
    <div className="service-card">
      <h3 className="service-card-name">{name}</h3>
      <p className="service-card-desc">{description}</p>
      <div className="service-card-footer">
        <span className="service-card-rate">
          £{hourlyRateGbp}<span>/hr</span>
        </span>
        <button className="btn btn-pink" onClick={() => setPopupOpen(true)}>
          Get in touch
        </button>
      </div>

      {popupOpen && (
        <ActionPopup
          clubToken={clubToken}
          club_id={club_id}
          entryId={serviceId}
          entryTitle={name}
          options={[{ action_key: "service_enquiry", label: "Get in touch", colour: "pink", token_cost: 0 }]}
          isFirstTokenEncounter={isFirstTokenEncounter}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </div>
  );
}
