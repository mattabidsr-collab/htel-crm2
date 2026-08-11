"use client";

import { useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";

export default function MfaSetupPage() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function startEnrollment() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/v1/auth/mfa/enroll", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      setError("Could not start MFA enrollment.");
      return;
    }
    const data = await res.json();
    setQrCodeDataUrl(data.qrCodeDataUrl);
    setOtpauthUri(data.otpauthUri);
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/v1/auth/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Invalid code.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="settings-page">
        <h1>Multi-factor authentication enabled</h1>
        <p>You&apos;ll need your authenticator app the next time you sign in.</p>
        <button className="btn btn-primary" onClick={() => signOut({ callbackUrl: "/login" })}>
          Sign in again
        </button>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h1>Set up multi-factor authentication</h1>
      <p>Required for administrator accounts before you can continue.</p>

      {error && <p className="auth-error">{error}</p>}

      {!qrCodeDataUrl ? (
        <button className="btn btn-primary" onClick={startEnrollment} disabled={loading}>
          {loading ? "Starting…" : "Start setup"}
        </button>
      ) : (
        <>
          <p>Scan this code with an authenticator app (Google Authenticator, 1Password, etc.).</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCodeDataUrl} alt="MFA enrollment QR code" width={200} height={200} />
          <p className="settings-page__manual-key">
            Can&apos;t scan? Enter this manually: <code>{otpauthUri}</code>
          </p>
          <form onSubmit={handleVerify} className="settings-page__form">
            <label className="form-field">
              Enter the 6-digit code to confirm
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Verifying…" : "Confirm"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
