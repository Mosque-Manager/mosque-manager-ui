import { requireRole } from '@/lib/rbac';
import MembersClient from './MembersClient';

export default async function MembersPage() {
  await requireRole(['admin']);

  return <MembersClient />;
}
