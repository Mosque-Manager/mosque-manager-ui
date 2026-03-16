import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Mosque from '@/lib/models/Mosque';
import Contributor from '@/lib/models/Contributor';
import Payment from '@/lib/models/Payment';
import { formatCurrency } from '@/lib/utils';
import type { SessionUser } from '@/types';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as SessionUser;
  await dbConnect();

  if (user.isSuperAdmin) {
    // Super Admin Dashboard
    const [totalMosques, totalContributors, totalExpectedMonthly] =
      await Promise.all([
        Mosque.countDocuments({ isActive: true }),
        Contributor.countDocuments({ isActive: true }),
        Contributor.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, total: { $sum: '$fixedMonthlyAmount' } } },
        ]).then((r) => r[0]?.total || 0),
      ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}! (Super Admin)
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Mosques
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMosques}</div>
              <p className="text-xs text-muted-foreground">Registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contributors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalContributors}</div>
              <p className="text-xs text-muted-foreground">Across all mosques</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expected Monthly
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalExpectedMonthly)}
              </div>
              <p className="text-xs text-muted-foreground">All mosques combined</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Manage Mosques</h3>
                <p className="text-sm text-muted-foreground">
                  View and manage all registered mosques
                </p>
              </div>
              <Link href="/mosques">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mosque Admin / Member Dashboard
  const mosqueId = user.mosqueId;
  let mosqueName = '';
  let contributorCount = 0;
  let expectedMonthly = 0;
  let collectedThisMonth = 0;
  let paidCount = 0;

  if (mosqueId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const mosqueObjId = new mongoose.Types.ObjectId(mosqueId);

    const [mosque, contribCount, monthlyAgg, paymentsAgg] = await Promise.all([
      Mosque.findById(mosqueId).lean(),
      Contributor.countDocuments({ mosqueId, isActive: true }),
      Contributor.aggregate([
        { $match: { mosqueId: mosqueObjId, isActive: true } },
        { $group: { _id: null, total: { $sum: '$fixedMonthlyAmount' } } },
      ]).then((r) => r[0]?.total || 0),
      Payment.aggregate([
        { $match: { mosqueId: mosqueObjId, month: currentMonth, year: currentYear } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]).then((r) => r[0] || { total: 0, count: 0 }),
    ]);
    mosqueName = mosque?.name || '';
    contributorCount = contribCount;
    expectedMonthly = monthlyAgg;
    collectedThisMonth = paymentsAgg.total;
    paidCount = paymentsAgg.count;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name}!
          {mosqueName && ` — ${mosqueName}`}
        </p>
      </div>

      {!mosqueId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Get Started</h3>
              <p className="text-muted-foreground">
                Register your mosque to start managing it.
              </p>
              <Link href="/mosques/new">
                <Button>Register Mosque</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Contributors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contributorCount}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Expected Monthly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(expectedMonthly)}
                </div>
                <p className="text-xs text-muted-foreground">From contributors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Collected
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(collectedThisMonth)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {paidCount}/{contributorCount} paid this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(expectedMonthly - collectedThisMonth)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {contributorCount - paidCount} unpaid this month
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
