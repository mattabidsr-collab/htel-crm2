"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateSiteForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        name,
        serviceCity: city || undefined,
        serviceState: state || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create site.");
      return;
    }

    setName("");
    setCity("");
    setState("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        Add site
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
          City
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        <label className="form-field">
          State
          <input value={state} onChange={(e) => setState(e.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save site"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}
