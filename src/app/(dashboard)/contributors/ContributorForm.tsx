'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { contributorSchema } from '@/lib/validations/contributor';
import type { ContributorData } from '@/types';

interface ContributorFormProps {
  contributor?: ContributorData;
  action: (formData: FormData) => Promise<{ success: boolean; message: string; errors?: Record<string, string[]> }>;
  title: string;
}

export default function ContributorForm({
  contributor,
  action,
  title,
}: ContributorFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    // Client-side validation
    const raw = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      fixedMonthlyAmount: Number(formData.get('fixedMonthlyAmount')),
      address: (formData.get('address') as string) || undefined,
    };

    const parsed = contributorSchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      setLoading(false);
      return;
    }

    const result = await action(formData);

    if (!result.success) {
      if (result.errors) {
        setErrors(result.errors);
      }
      setMessage(result.message);
      setLoading(false);
      return;
    }

    router.push('/contributors');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={contributor?.name}
                placeholder="Contributor name"
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={contributor?.phone}
                placeholder="10+ digit phone number"
                required
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fixedMonthlyAmount">Monthly Amount (₹) *</Label>
              <Input
                id="fixedMonthlyAmount"
                name="fixedMonthlyAmount"
                type="number"
                min="1"
                step="any"
                defaultValue={contributor?.fixedMonthlyAmount}
                placeholder="e.g. 500"
                required
              />
              {errors.fixedMonthlyAmount && (
                <p className="text-sm text-destructive">
                  {errors.fixedMonthlyAmount[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                name="address"
                defaultValue={contributor?.address}
                placeholder="Address"
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address[0]}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : contributor ? 'Update' : 'Add Contributor'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
