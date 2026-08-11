"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button className="btn" onClick={() => signOut({ callbackUrl: "/login" })}>
      Log out
    </button>
  );
}
