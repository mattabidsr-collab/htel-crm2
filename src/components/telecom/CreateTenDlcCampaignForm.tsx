"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateTenDlcCampaignForm({ brandId }: { brandId: string }) {
  const router = useRouter();
  const [useCase, setUseCase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/v1/tendlc/brands/${brandId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useCase: useCase || undefined }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create campaign.");
      return;
    }

    setUseCase("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn task-row__complete" onClick={() => setOpen(true)}>
        Add campaign
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Use case
          <input value={useCase} onChange={(e) => setUseCase(e.target.value)} />
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
