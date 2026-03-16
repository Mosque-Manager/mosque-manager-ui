import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/rbac';
import { getContributor } from '@/lib/actions/contributor';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Pencil, ArrowLeft } from 'lucide-react';

interface ContributorDetailPageProps {
  params: { id: string };
}

export default async function ContributorDetailPage({
  params,
}: ContributorDetailPageProps) {
  await requireRole(['admin', 'member']);

  const contributor = await getContributor(params.id);
  if (!contributor) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contributors">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {contributor.name}
          </h1>
        </div>
        <Link href={`/contributors/${contributor._id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Contributor Details
            <Badge variant={contributor.isActive ? 'default' : 'secondary'}>
              {contributor.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{contributor.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{contributor.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Amount</p>
              <p className="font-medium">
                {formatCurrency(contributor.fixedMonthlyAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">
                {contributor.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          {contributor.address && (
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{contributor.address}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Added on</p>
            <p className="font-medium">
              {new Date(contributor.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment history placeholder — will be implemented in R3 */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Payment tracking will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
