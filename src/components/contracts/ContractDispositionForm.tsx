"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { RenewalDisposition } from "@prisma/client";

const DISPOSITIONS: RenewalDisposition[] = [
  "PENDING",
  "RENEWED",
  "EXPANDED",
  "DOWNSIZED",
  "CHURNED",
  "MONTH_TO_MONTH",
];

export function ContractDispositionForm({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [disposition, setDisposition] = useState<RenewalDisposition>("RENEWED");
  const [endDate, setEndDate] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    // Business rule 6: marking a contract renewed requires a new end date
    // and term (enforced again server-side).
    const body: Record<string, unknown> = {
      renewalDisposition: disposition,
      renewalNotes: notes || undefined,
    };
    if (disposition === "RENEWED") {
      body.endDate = endDate;
      body.termMonths = Number(termMonths);
      body.status = "RENEWED";
    } else if (disposition === "CHURNED") {
      body.status = "TERMINATED";
    }

    const res = await fetch(`/api/v1/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not record disposition.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn task-row__complete" onClick={() => setOpen(true)}>
        Record renewal
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Disposition
          <select
            value={disposition}
            onChange={(e) => setDisposition(e.target.value as RenewalDisposition)}
          >
            {DISPOSITIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        {disposition === "RENEWED" && (
          <>
            <label className="form-field">
              New end date
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </label>
            <label className="form-field">
              New term (months)
              <input
                type="number"
                min="1"
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                required
              />
            </label>
          </>
        )}
        <label className="form-field">
          Notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
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
