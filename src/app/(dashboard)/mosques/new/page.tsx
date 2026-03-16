'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMosque } from '@/lib/actions/mosque';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewMosquePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const result = await createMosque(formData);

    if (result.success) {
      router.push('/mosques');
    } else {
      setError(result.message);
      if (result.errors) {
        setFieldErrors(result.errors);
      }
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mosques">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Mosque</h1>
          <p className="text-muted-foreground">
            Add a new mosque to manage
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Mosque Details</CardTitle>
          <CardDescription>
            Enter the basic information for the mosque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Mosque Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Masjid-e-Noor"
                required
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive">
                  {fieldErrors.name[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="Street address"
              />
              {fieldErrors.address && (
                <p className="text-xs text-destructive">
                  {fieldErrors.address[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="City" />
              {fieldErrors.city && (
                <p className="text-xs text-destructive">
                  {fieldErrors.city[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="10-digit phone number"
              />
              {fieldErrors.phone && (
                <p className="text-xs text-destructive">
                  {fieldErrors.phone[0]}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Mosque'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
