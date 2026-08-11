"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ContactRole } from "@prisma/client";

const ROLES: ContactRole[] = [
  "DECISION_MAKER",
  "CHAMPION",
  "TECHNICAL",
  "BILLING",
  "EMERGENCY",
  "SITE_CONTACT",
  "FORMER",
];

export function CreateContactForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ContactRole>("TECHNICAL");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        firstName,
        lastName,
        emails: email ? [email] : [],
        role,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create contact.");
      return;
    }

    setFirstName("");
    setLastName("");
    setEmail("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        Add contact
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          First name
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label className="form-field">
          Last name
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>
        <label className="form-field">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="form-field">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as ContactRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save contact"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}
