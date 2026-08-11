"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CallNoteReviewForm({ callNoteId }: { callNoteId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState("");
  const [disposition, setDisposition] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/v1/call-notes/${callNoteId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary,
        disposition: disposition || undefined,
        nextAction: nextAction || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not complete review.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn task-row__complete" onClick={() => setOpen(true)}>
        Complete review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field" style={{ flex: "1 1 100%" }}>
          What happened on this call?
          <input value={summary} onChange={(e) => setSummary(e.target.value)} required />
        </label>
        <label className="form-field">
          Disposition
          <input value={disposition} onChange={(e) => setDisposition(e.target.value)} />
        </label>
        <label className="form-field">
          Next action
          <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
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
