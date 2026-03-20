import type { NextAuthConfig } from 'next-auth';
import type { SessionUser } from '@/types';

/**
 * Edge-safe NextAuth config (no mongoose/bcrypt imports).
 * Used by middleware.ts. The full config in auth.ts extends this.
 */
export const authConfig: NextAuthConfig = {
  providers: [], // Providers added in auth.ts (not edge-safe)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/signup');

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      return isLoggedIn;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as SessionUser & { id: string };
        token.id = u.id;
        token.isSuperAdmin = u.isSuperAdmin;
        token.mosqueId = u.mosqueId;
        token.role = u.role;
        token.lang = u.lang;
      }
      // When update() is called from client, patch the token
      if (trigger === 'update' && session) {
        if (session.mosqueId) token.mosqueId = session.mosqueId;
        if (session.role) token.role = session.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as SessionUser;
        u.id = token.id as string;
        u.isSuperAdmin = token.isSuperAdmin as boolean;
        u.mosqueId = token.mosqueId as string | undefined;
        u.role = token.role as SessionUser['role'] | undefined;
        u.lang = (token.lang as SessionUser['lang']) || 'en';
      }
      return session;
    },
  },
};
