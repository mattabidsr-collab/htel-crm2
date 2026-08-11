import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/v1/health",
  // Inbound service-to-service webhooks — authenticated by a shared secret
  // inside the route handler (requireWebhookSecret), not a user session.
  "/api/v1/integrations/connectuc",
];
const MFA_SETUP_PATHS = ["/settings/mfa", "/api/v1/auth/mfa"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // ADM-01: MFA is required for administrators. Route everything else to
  // enrollment until it's completed.
  const isMfaSetup = MFA_SETUP_PATHS.some((path) => pathname.startsWith(path));
  if (
    req.auth?.user.role === "ADMINISTRATOR" &&
    !req.auth.user.mfaEnabled &&
    !isMfaSetup &&
    !isPublic
  ) {
    return NextResponse.redirect(new URL("/settings/mfa", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
