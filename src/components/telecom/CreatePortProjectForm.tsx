"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreatePortProjectForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [losingCarrier, setLosingCarrier] = useState("");
  const [numbers, setNumbers] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const didNumbers = numbers
      .split(/[\s,]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    const res = await fetch("/api/v1/ports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        losingCarrier: losingCarrier || undefined,
        status: "SUBMITTED",
        requestedDate: new Date().toISOString(),
        didNumbers,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create port project.");
      return;
    }

    setLosingCarrier("");
    setNumbers("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        Add port project
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Losing carrier
          <input value={losingCarrier} onChange={(e) => setLosingCarrier(e.target.value)} />
        </label>
        <label className="form-field">
          Numbers (comma-separated)
          <input value={numbers} onChange={(e) => setNumbers(e.target.value)} required />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}
