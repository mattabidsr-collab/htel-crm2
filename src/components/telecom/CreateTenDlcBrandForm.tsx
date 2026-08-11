"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateTenDlcBrandForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [legalName, setLegalName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/tendlc/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, legalName: legalName || undefined }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create brand.");
      return;
    }

    setLegalName("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        Add 10DLC brand
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Legal name
          <input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
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
