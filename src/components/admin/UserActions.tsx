"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@prisma/client";

const ROLES: UserRole[] = [
  "ADMINISTRATOR",
  "OPERATIONS_LEADER",
  "SUPPORT",
  "SALES",
  "BILLING_ADMIN",
  "READ_ONLY",
];

interface UserActionsProps {
  userId: string;
  role: UserRole;
  isActive: boolean;
}

export function UserActions({ userId, role, isActive }: UserActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setWarning(null);
    const res = await fetch(`/api/v1/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok && typeof data.openTaskCount === "number" && data.openTaskCount > 0) {
      setWarning(`${data.openTaskCount} open task(s) still owned by this user — reassign them.`);
    }
    router.refresh();
  }

  return (
    <div className="user-actions">
      <select
        value={role}
        disabled={busy}
        onChange={(e) => patch({ role: e.target.value })}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button className="btn" disabled={busy} onClick={() => patch({ isActive: !isActive })}>
        {isActive ? "Deactivate" : "Reactivate"}
      </button>
      {warning && <p className="user-actions__warning">{warning}</p>}
    </div>
  );
}
