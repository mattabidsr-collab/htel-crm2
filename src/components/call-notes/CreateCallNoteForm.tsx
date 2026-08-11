"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { CallDirection } from "@prisma/client";

export function CreateCallNoteForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [direction, setDirection] = useState<CallDirection>("OUTBOUND");
  const [summary, setSummary] = useState("");
  const [disposition, setDisposition] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDueDate, setNextActionDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/call-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        direction,
        summary,
        disposition: disposition || undefined,
        nextAction: nextAction || undefined,
        nextActionDueDate: nextActionDueDate || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save call note.");
      return;
    }

    setSummary("");
    setDisposition("");
    setNextAction("");
    setNextActionDueDate("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        Log a call
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Direction
          <select value={direction} onChange={(e) => setDirection(e.target.value as CallDirection)}>
            <option value="OUTBOUND">Outbound</option>
            <option value="INBOUND">Inbound</option>
          </select>
        </label>
        <label className="form-field" style={{ flex: "1 1 100%" }}>
          Summary
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
        {nextAction && (
          <label className="form-field">
            Next action due
            <input
              type="date"
              value={nextActionDueDate}
              onChange={(e) => setNextActionDueDate(e.target.value)}
            />
          </label>
        )}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save call note"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}
