"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { MailboxProvider } from "@prisma/client";

export function CreateMailboxForm() {
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [provider, setProvider] = useState<MailboxProvider>("MICROSOFT");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/mailboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailAddress, provider }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not connect mailbox.");
      return;
    }

    setEmailAddress("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="invite-form__fields">
        <label className="form-field">
          Mailbox address
          <input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="support@heritagetel.com"
            required
          />
        </label>
        <label className="form-field">
          Provider
          <select value={provider} onChange={(e) => setProvider(e.target.value as MailboxProvider)}>
            <option value="MICROSOFT">Microsoft (Outlook)</option>
            <option value="MOCK">Mock (testing)</option>
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Connecting…" : "Connect mailbox"}
        </button>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}
