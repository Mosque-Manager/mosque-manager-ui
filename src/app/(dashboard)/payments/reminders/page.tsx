import { requireRole, getMosqueId } from '@/lib/rbac';
import dbConnect from '@/lib/db';
import Mosque from '@/lib/models/Mosque';
import RemindersClient from './RemindersClient';

export default async function RemindersPage() {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  await dbConnect();
  const mosque = await Mosque.findById(mosqueId).lean();
  const mosqueName = mosque?.name || 'Mosque';

  const now = new Date();

  return (
    <RemindersClient
      initialMonth={now.getMonth() + 1}
      initialYear={now.getFullYear()}
      mosqueName={mosqueName}
      lang={user.lang}
    />
  );
}
