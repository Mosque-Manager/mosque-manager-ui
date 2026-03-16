import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/rbac';
import { getMosque, getMosqueContributors } from '@/lib/actions/mosque';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Building2, Users, Phone, MapPin } from 'lucide-react';

interface MosqueDetailPageProps {
  params: { id: string };
}

export default async function MosqueDetailPage({
  params,
}: MosqueDetailPageProps) {
  await getSessionUser();

  const mosque = await getMosque(params.id);
  if (!mosque) {
    notFound();
  }

  const contributors = await getMosqueContributors(params.id);

  const totalMonthly = contributors.reduce(
    (sum, c) => sum + c.fixedMonthlyAmount,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mosques">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-7 w-7" />
          {mosque.name}
        </h1>
      </div>

      {/* Mosque Info */}
      <Card>
        <CardHeader>
          <CardTitle>Mosque Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {mosque.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{mosque.city}</p>
                </div>
              </div>
            )}
            {mosque.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{mosque.address}</p>
                </div>
              </div>
            )}
            {mosque.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{mosque.phone}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(mosque.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{contributors.length}</p>
                <p className="text-xs text-muted-foreground">
                  Active Contributors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">
              {formatCurrency(totalMonthly)}
            </p>
            <p className="text-xs text-muted-foreground">
              Expected Monthly Collection
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Badge variant="default">Active</Badge>
            <p className="text-xs text-muted-foreground mt-1">Mosque Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Contributors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contributors ({contributors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contributors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contributors registered yet.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Monthly Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributors.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>
                        {formatCurrency(c.fixedMonthlyAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
