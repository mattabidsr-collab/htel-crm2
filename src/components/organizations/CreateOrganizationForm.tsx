"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { OrganizationType } from "@prisma/client";

const TYPES: OrganizationType[] = [
  "PROSPECT",
  "CUSTOMER",
  "FORMER_CUSTOMER",
  "PARTNER",
  "VENDOR",
  "RELATED_PARTY",
];

export function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<OrganizationType>("PROSPECT");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, types: [type] }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create organization.");
      return;
    }

    router.push(`/organizations/${data.data.id}`);
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        New organization
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="form-field">
          Type
          <select value={type} onChange={(e) => setType(e.target.value as OrganizationType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}
