import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DashboardShell from '@/components/dashboard/DashboardShell';
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

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
