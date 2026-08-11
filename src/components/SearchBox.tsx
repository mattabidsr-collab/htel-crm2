"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="search"
        placeholder="Search organizations, sites, contacts…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="search-box"
      />
    </form>
  );
}
