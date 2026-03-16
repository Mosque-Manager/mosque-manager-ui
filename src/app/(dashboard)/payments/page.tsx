import { requireRole } from '@/lib/rbac';
import PaymentsClient from './PaymentsClient';

export default async function PaymentsPage() {
  await requireRole(['admin']);

  const now = new Date();

  return (
    <PaymentsClient
      initialMonth={now.getMonth() + 1}
      initialYear={now.getFullYear()}
    />
  );
}
