import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

// Edge-safe subset of the Auth.js config (no Prisma/bcrypt), used directly by
// middleware. src/lib/auth.ts extends this with the Credentials provider.

type DefaultSessionUser = { name?: string | null; email?: string | null };

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      mfaEnabled: boolean;
    } & DefaultSessionUser;
  }
}

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
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
} satisfies NextAuthConfig;
