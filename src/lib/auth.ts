import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { verifyMfaToken } from "@/modules/auth/mfa";
import { authConfig } from "@/lib/auth.config";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class MfaRequiredError extends CredentialsSignin {
  code = "mfa_required";
}

class InvalidMfaCodeError extends CredentialsSignin {
  code = "invalid_mfa_code";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "Authenticator code", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        const totp = credentials?.totp;
        if (typeof email !== "string" || typeof password !== "string") {
          throw new InvalidCredentialsError();
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
          throw new InvalidCredentialsError();
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
          await recordAuditEvent({
            actorId: user.id,
            action: "auth.login_failed",
            entityType: "User",
            entityId: user.id,
          });
          throw new InvalidCredentialsError();
        }

        // ADM-01: MFA is required for administrators, available to everyone.
        if (user.mfaEnabled) {
          if (typeof totp !== "string" || totp.length === 0) {
            throw new MfaRequiredError();
          }
          if (!user.mfaSecretEncrypted || !verifyMfaToken(user.mfaSecretEncrypted, totp)) {
            await recordAuditEvent({
              actorId: user.id,
              action: "auth.mfa_failed",
              entityType: "User",
              entityId: user.id,
            });
            throw new InvalidMfaCodeError();
          }
        }

        await recordAuditEvent({
          actorId: user.id,
          action: "auth.login_succeeded",
          entityType: "User",
          entityId: user.id,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        };
      },
    }),
  ],
});
