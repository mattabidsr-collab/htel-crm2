"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
  invalid_mfa_code: "That authenticator code didn't work. Try again.",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      totp,
      redirect: false,
    });

    setSubmitting(false);

    if (!result || result.error) {
      const code = result?.code ?? "invalid_credentials";
      if (code === "mfa_required") {
        setMfaRequired(true);
        return;
      }
      setError(ERROR_MESSAGES[code] ?? "Unable to sign in.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Heritage CRM</h1>
        {error && <p className="auth-error">{error}</p>}

        {!mfaRequired ? (
          <>
            <label>
              Email
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            <p>Enter the 6-digit code from your authenticator app.</p>
            <label>
              Authenticator code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
              />
            </label>
          </>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : mfaRequired ? "Verify" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
