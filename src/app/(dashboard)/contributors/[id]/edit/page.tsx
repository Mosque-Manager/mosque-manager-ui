import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/rbac';
import { getContributor, updateContributor } from '@/lib/actions/contributor';
import ContributorForm from '../../ContributorForm';

interface EditContributorPageProps {
  params: { id: string };
}

export default async function EditContributorPage({
  params,
}: EditContributorPageProps) {
  await requireRole(['admin']);

  const contributor = await getContributor(params.id);
  if (!contributor) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    'use server';
    return updateContributor(params.id, formData);
  }

  return (
    <ContributorForm
      contributor={contributor}
      action={handleUpdate}
      title="Edit Contributor"
    />
  );
}
