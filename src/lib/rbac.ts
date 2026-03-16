import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { UserRole, SessionUser } from '@/types';

/**
 * Get the current session user. Throws redirect to /login if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  return session.user as SessionUser;
}

/**
 * Check if the session user has one of the allowed roles.
 * Super admins always pass.
 */
export function checkRole(
  user: SessionUser,
  allowedRoles: UserRole[]
): boolean {
  if (user.isSuperAdmin) return true;
  if (!user.role) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Require one of the allowed roles. Redirects to dashboard if unauthorized.
 * Super admins always pass.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!checkRole(user, allowedRoles)) {
    redirect('/');
  }
  return user;
}

/**
 * Require super admin access. Redirects to dashboard if not super admin.
 */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user.isSuperAdmin) {
    redirect('/');
  }
  return user;
}

/**
 * Get the mosque ID from the session. Throws redirect if no mosque context.
 * Super admins may not have a mosqueId — use this only for mosque-scoped pages.
 */
export function getMosqueId(user: SessionUser): string {
  if (!user.mosqueId) {
    redirect('/mosques');
  }
  return user.mosqueId;
}
