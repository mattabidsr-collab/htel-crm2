"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { PlatformProvider } from "@prisma/client";

const PROVIDERS: PlatformProvider[] = ["SKYSWITCH", "NETSAPIENS", "OTHER"];

export function CreatePlatformAccountForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [provider, setProvider] = useState<PlatformProvider>("SKYSWITCH");
  const [providerAccountId, setProviderAccountId] = useState("");
  const [netsapiensDomain, setNetsapiensDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/platform-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        provider,
        providerAccountId: providerAccountId || undefined,
        netsapiensDomain: netsapiensDomain || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create platform account.");
      return;
    }

    setProviderAccountId("");
    setNetsapiensDomain("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        Add platform account
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Provider
          <select value={provider} onChange={(e) => setProvider(e.target.value as PlatformProvider)}>
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Account ID
          <input value={providerAccountId} onChange={(e) => setProviderAccountId(e.target.value)} />
        </label>
        <label className="form-field">
          NetSapiens domain
          <input value={netsapiensDomain} onChange={(e) => setNetsapiensDomain(e.target.value)} />
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
