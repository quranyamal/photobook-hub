import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@/generated/prisma/enums";

export const authConfig = {
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role ?? UserRole.CUSTOMER) as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
