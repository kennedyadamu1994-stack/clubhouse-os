"use client";

import { useState } from "react";
import { ContactUsForm } from "./contact-us-form";

/** Trigger for the Contact Us modal — same open/close pattern as ListCalloutButton. */
export function ContactButton({ clubToken, club_id }: { clubToken: string; club_id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn btn-pink" onClick={() => setOpen(true)}>
        Contact us
      </button>
      {open && <ContactUsForm clubToken={clubToken} club_id={club_id} onClose={() => setOpen(false)} />}
    </>
  );
}
