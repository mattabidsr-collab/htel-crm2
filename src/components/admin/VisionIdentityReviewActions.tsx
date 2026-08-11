"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface OrgOption {
  id: string;
  name: string;
}

export function VisionIdentityReviewActions({
  mappingId,
  organizations,
}: {
  mappingId: string;
  organizations: OrgOption[];
}) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function map() {
    if (!organizationId) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/vision-identities/${mappingId}/map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not map.");
      return;
    }
    router.refresh();
  }

  async function ignore() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/vision-identities/${mappingId}/ignore`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not ignore.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="user-actions">
      <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} disabled={busy}>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      <button className="btn btn-primary" onClick={map} disabled={busy || !organizationId}>
        Map
      </button>
      <button className="btn" onClick={ignore} disabled={busy}>
        Ignore
      </button>
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}
