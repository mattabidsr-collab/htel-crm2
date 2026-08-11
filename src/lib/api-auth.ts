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

/**
 * Auth for inbound service-to-service webhooks (e.g. Activepieces calling
 * in on behalf of ConnectUC) — a shared secret in the Authorization
 * header, not a user session. These routes must also be listed in
 * `PUBLIC_PATHS` in `src/proxy.ts` so the session-based route guard lets
 * the request through to this check at all.
 */
export function requireWebhookSecret(request: Request, expected: string | undefined) {
  const provided = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!expected || provided !== expected) {
    throw new ApiAuthError(401, "Invalid or missing webhook secret");
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
