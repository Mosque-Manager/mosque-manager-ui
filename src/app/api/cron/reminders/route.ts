import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Mosque from '@/lib/models/Mosque';
import Contributor from '@/lib/models/Contributor';
import Payment from '@/lib/models/Payment';

/**
 * Vercel Cron endpoint — runs on the 5th of each month.
 * Queries all mosques, finds unpaid contributors, logs counts.
 *
 * vercel.json config:
 * { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 8 5 * *" }] }
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const mosques = await Mosque.find({ isActive: true }).lean();

  const results: { mosqueId: string; name: string; unpaidCount: number }[] = [];

  for (const mosque of mosques) {
    const mosqueId = mosque._id;

    const [contributorCount, paymentCount] = await Promise.all([
      Contributor.countDocuments({ mosqueId, isActive: true }),
      Payment.countDocuments({ mosqueId, month, year }),
    ]);

    const unpaidCount = contributorCount - paymentCount;
    results.push({
      mosqueId: String(mosqueId),
      name: mosque.name,
      unpaidCount,
    });
  }

  const totalUnpaid = results.reduce((sum, r) => sum + r.unpaidCount, 0);

  console.log(
    `[cron/reminders] ${now.toISOString()} — ${mosques.length} mosques, ${totalUnpaid} total unpaid contributors for ${month}/${year}`
  );
  for (const r of results) {
    if (r.unpaidCount > 0) {
      console.log(`  ${r.name}: ${r.unpaidCount} unpaid`);
    }
  }

  return NextResponse.json({
    ok: true,
    month,
    year,
    mosquesChecked: mosques.length,
    totalUnpaid,
    details: results,
  });
}
