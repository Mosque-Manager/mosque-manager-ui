import { requireRole } from '@/lib/rbac';
import InviteClient from './InviteClient';

export default async function InviteMemberPage() {
  await requireRole(['admin']);

  return <InviteClient />;
}
