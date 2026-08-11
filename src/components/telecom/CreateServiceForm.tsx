"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ServiceType } from "@prisma/client";

const TYPES: ServiceType[] = [
  "HOSTED_SEAT",
  "CONVENIENCE_SEAT",
  "FAX",
  "CONTACT_CENTER",
  "SMS",
  "RABBITRUN",
  "DIA",
  "NUMBER_DID",
  "HARDWARE",
  "OTHER_RECURRING",
];

export function CreateServiceForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [type, setType] = useState<ServiceType>("HOSTED_SEAT");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        type,
        status: "ACTIVE",
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        unitCost: unitCost ? Number(unitCost) : undefined,
        activationDate: new Date().toISOString(),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create service.");
      return;
    }

    setUnitPrice("");
    setUnitCost("");
    setQuantity("1");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        Add service
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Type
          <select value={type} onChange={(e) => setType(e.target.value as ServiceType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Quantity
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="form-field">
          Unit price ($/mo)
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            required
          />
        </label>
        <label className="form-field">
          Unit cost ($/mo, optional)
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
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
