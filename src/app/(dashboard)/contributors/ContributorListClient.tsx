'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DataTable, { type Column } from '@/components/shared/DataTable';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import {
  getContributors,
  deleteContributor,
  type ContributorListResult,
} from '@/lib/actions/contributor';
import { formatCurrency } from '@/lib/utils';
import type { ContributorData } from '@/types';

type StatusFilter = 'active' | 'inactive' | 'all';

interface ContributorListClientProps {
  isReadOnly?: boolean;
}

export default function ContributorListClient({ isReadOnly = false }: ContributorListClientProps) {
  const router = useRouter();
  const [data, setData] = useState<ContributorListResult | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchContributors = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getContributors({ search, status, page });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchContributors();
  }, [fetchContributors]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteContributor(deleteId);
    if (result.success) {
      setDeleteId(null);
      fetchContributors();
    }
  }

  const columns: Column<ContributorData>[] = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'fixedMonthlyAmount',
      label: 'Monthly Amount',
      render: (item) => formatCurrency(item.fixedMonthlyAmount),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/contributors/${item._id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {!isReadOnly && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/contributors/${item._id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {item.isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(item._id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contributors</h1>
          <p className="text-muted-foreground">
            Manage monthly contributors
          </p>
        </div>
        <Link href="/contributors/new">
          <Button className={isReadOnly ? 'hidden' : ''}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contributor
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['active', 'inactive', 'all'] as StatusFilter[]).map((s) => (
            <Button
              key={s}
              variant={status === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : data ? (
        <DataTable
          columns={columns}
          data={data.contributors}
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={setPage}
          emptyMessage="No contributors found"
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteId}
        title="Deactivate Contributor"
        description="Are you sure you want to deactivate this contributor? They will no longer appear in the active list."
        confirmLabel="Deactivate"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </div>
  );
}
