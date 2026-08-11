"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface OrgOption {
  id: string;
  name: string;
}

export function EmailThreadReviewActions({
  threadId,
  organizations,
}: {
  threadId: string;
  organizations: OrgOption[];
}) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function associate() {
    if (!organizationId) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/email-threads/${threadId}/associate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not associate.");
      return;
    }
    router.refresh();
  }

  async function exclude() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/email-threads/${threadId}/exclude`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not exclude.");
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
      <button className="btn btn-primary" onClick={associate} disabled={busy || !organizationId}>
        Associate
      </button>
      <button className="btn" onClick={exclude} disabled={busy}>
        Exclude
      </button>
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}
