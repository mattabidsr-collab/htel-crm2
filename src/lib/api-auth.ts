import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";

import { auth } from "@/lib/auth";

export class ApiAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Resolves the current session or throws a 401. All module-level permission checks build on this. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new ApiAuthError(401, "Authentication required");
  }
  return session.user;
}

/** MVP uses module-level role permissions (section 3); record-level restrictions are a later phase. */
export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ApiAuthError(403, `Requires one of roles: ${roles.join(", ")}`);
  }
  return user;
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
