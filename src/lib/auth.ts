import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      mfaEnabled: boolean;
    } & DefaultSessionUser;
  }
}

// Minimal shape kept local so we don't depend on next-auth's internal type export path.
type DefaultSessionUser = { name?: string | null; email?: string | null };

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordAuditEvent({
            actorId: user.id,
            action: "auth.login_failed",
            entityType: "User",
            entityId: user.id,
          });
          return null;
        }

        // ADM-01: MFA is required for administrators. The challenge/verify flow
        // is implemented in Stage 1 (Foundation); this stub records the
        // requirement on the session so the UI can gate access to it.
        await recordAuditEvent({
          actorId: user.id,
          action: "auth.login_succeeded",
          entityType: "User",
          entityId: user.id,
        });

        return { id: user.id, name: user.name, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.mfaEnabled = (user as { mfaEnabled: boolean }).mfaEnabled;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = token.role as UserRole;
      session.user.mfaEnabled = token.mfaEnabled as boolean;
      return session;
    },
  },
});
