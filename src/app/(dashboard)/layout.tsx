import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { getUnpaidCount } from '@/lib/actions/payment';
import type { SessionUser } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as SessionUser;

  // Fetch unpaid count for admin users (for sidebar badge)
  let unpaidCount = 0;
  if (!user.isSuperAdmin && user.role === 'admin' && user.mosqueId) {
    try {
      unpaidCount = await getUnpaidCount();
    } catch {
      // Silently fail — badge just won't show
    }
  }

  return <DashboardShell user={user} unpaidCount={unpaidCount}>{children}</DashboardShell>;
}
