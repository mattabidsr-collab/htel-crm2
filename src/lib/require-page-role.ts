import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { auth } from "@/lib/auth";

/** Server-component equivalent of requireRole() for pages, not API routes. */
export async function requirePageRole(...roles: UserRole[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!roles.includes(session.user.role)) redirect("/");
  return session.user;
}
