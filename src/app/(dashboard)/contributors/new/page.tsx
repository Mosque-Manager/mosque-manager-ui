import { requireRole } from '@/lib/rbac';
import { createContributor } from '@/lib/actions/contributor';
import ContributorForm from '../ContributorForm';

export default async function NewContributorPage() {
  await requireRole(['admin']);

  return (
    <ContributorForm
      action={createContributor}
      title="Add Contributor"
    />
  );
}
