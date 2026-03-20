import { requireRole } from '@/lib/rbac';
import ContributorListClient from './ContributorListClient';

export default async function ContributorsPage() {
  const user = await requireRole(['admin', 'member']);
  const isReadOnly = user.role === 'member';

  return <ContributorListClient isReadOnly={isReadOnly} />;
}
