import { requireRole } from '@/lib/rbac';
import PaymentsClient from './PaymentsClient';

export default async function PaymentsPage() {
  const user = await requireRole(['admin', 'member']);
  const isReadOnly = user.role === 'member';

  const now = new Date();

  return (
    <PaymentsClient
      initialMonth={now.getMonth() + 1}
      initialYear={now.getFullYear()}
      isReadOnly={isReadOnly}
    />
  );
}
