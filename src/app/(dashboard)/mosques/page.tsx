import { requireSuperAdmin } from '@/lib/rbac';
import { getMosques } from '@/lib/actions/mosque';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building2, Plus } from 'lucide-react';

export default async function MosquesPage() {
  await requireSuperAdmin();
  const mosques = await getMosques();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mosques</h1>
          <p className="text-muted-foreground">
            Manage all registered mosques
          </p>
        </div>
        <Link href="/mosques/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Mosque
          </Button>
        </Link>
      </div>

      {mosques.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No mosques yet</h3>
              <p className="text-muted-foreground">
                Create your first mosque to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mosques.map((mosque) => (
            <Card key={mosque._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {mosque.name}
                </CardTitle>
                {mosque.city && (
                  <CardDescription>{mosque.city}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {mosque.address && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {mosque.address}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created {new Date(mosque.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
