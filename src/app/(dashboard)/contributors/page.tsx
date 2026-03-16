import { requireRole } from '@/lib/rbac';
import ContributorListClient from './ContributorListClient';

export default async function ContributorsPage() {
  await requireRole(['admin']);

  return <ContributorListClient />;
}
