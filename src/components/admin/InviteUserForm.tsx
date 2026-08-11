"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ROLES = [
  "ADMINISTRATOR",
  "OPERATIONS_LEADER",
  "SUPPORT",
  "SALES",
  "BILLING_ADMIN",
  "READ_ONLY",
] as const;

export function InviteUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("READ_ONLY");
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setTemporaryPassword(null);

    const res = await fetch("/api/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, role }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not invite user.");
      return;
    }

    setTemporaryPassword(data.temporaryPassword);
    setEmail("");
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="form-field">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="form-field">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Inviting…" : "Invite user"}
        </button>
      </div>
      {error && <p className="auth-error">{error}</p>}
      {temporaryPassword && (
        <p className="invite-form__temp-password">
          Temporary password (share out-of-band, shown once): <code>{temporaryPassword}</code>
        </p>
      )}
    </form>
  );
}
