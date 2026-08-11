"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ContractType } from "@prisma/client";

const TYPES: ContractType[] = ["MSA", "SOW", "AMENDMENT", "OTHER"];

export function CreateContractForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [type, setType] = useState<ContractType>("MSA");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [noticeDays, setNoticeDays] = useState("60");
  const [autoRenew, setAutoRenew] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        type,
        status: "ACTIVE",
        effectiveDate: effectiveDate || undefined,
        endDate: endDate || undefined,
        termMonths: termMonths ? Number(termMonths) : undefined,
        noticeDays: Number(noticeDays),
        autoRenew,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create contract.");
      return;
    }

    setEndDate("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        New contract
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Type
          <select value={type} onChange={(e) => setType(e.target.value as ContractType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Effective date
          <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        </label>
        <label className="form-field">
          End date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </label>
        <label className="form-field">
          Term (months)
          <input type="number" min="1" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} />
        </label>
        <label className="form-field">
          Notice days
          <input type="number" min="0" value={noticeDays} onChange={(e) => setNoticeDays(e.target.value)} />
        </label>
        <label className="form-field">
          Auto-renew
          <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save contract"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}
