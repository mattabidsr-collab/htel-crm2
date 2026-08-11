"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateTaskForm({
  organizationId,
  ownerId,
}: {
  organizationId?: string;
  ownerId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        organizationId,
        ownerId,
        dueDate: dueDate || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create task.");
      return;
    }

    setTitle("");
    setDueDate("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="form-field">
          Due date
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save task"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}
