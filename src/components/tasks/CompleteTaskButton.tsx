"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function complete() {
    setBusy(true);
    await fetch(`/api/v1/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button className="btn task-row__complete" disabled={busy} onClick={complete}>
      {busy ? "…" : "Complete"}
    </button>
  );
}
