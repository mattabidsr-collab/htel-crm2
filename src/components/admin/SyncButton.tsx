"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton({ endpoint, label }: { endpoint: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    const res = await fetch(endpoint, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setResult(`Failed: ${data.error ?? res.status}`);
      return;
    }
    setResult(JSON.stringify(data.data));
    router.refresh();
  }

  return (
    <div className="sync-button">
      <button className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? "Syncing…" : label}
      </button>
      {result && <span className="sync-button__result">{result}</span>}
    </div>
  );
}
