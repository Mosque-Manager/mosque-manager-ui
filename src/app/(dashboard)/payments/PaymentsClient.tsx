'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getMonthlyPayments,
  getPaymentSummary,
  recordPayment,
  removePayment,
} from '@/lib/actions/payment';
import { formatCurrency } from '@/lib/utils';
import type { MonthlyPaymentRow, PaymentSummary } from '@/types';
import SummaryCard from '@/components/dashboard/SummaryCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IndianRupee,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Undo2,
  CreditCard,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface PaymentsClientProps {
  initialMonth: number;
  initialYear: number;
}

export default function PaymentsClient({
  initialMonth,
  initialYear,
}: PaymentsClientProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [rows, setRows] = useState<MonthlyPaymentRow[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<{
    id: string;
    name: string;
    amount: number;
  } | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rowData, summaryData] = await Promise.all([
        getMonthlyPayments(month, year),
        getPaymentSummary(month, year),
      ]);
      setRows(rowData);
      setSummary(summaryData);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function goToPreviousMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function openPaymentDialog(contributorId: string, name: string, amount: number) {
    setSelectedContributor({ id: contributorId, name, amount });
    setError('');
    setDialogOpen(true);
  }

  async function handleRecordPayment(formData: FormData) {
    if (!selectedContributor) return;
    setFormLoading(true);
    setError('');

    formData.set('contributorId', selectedContributor.id);
    formData.set('month', String(month));
    formData.set('year', String(year));

    const result = await recordPayment(formData);
    setFormLoading(false);

    if (result.success) {
      setDialogOpen(false);
      setSelectedContributor(null);
      fetchData();
    } else {
      setError(result.message);
    }
  }

  async function handleUndo(paymentId: string) {
    const result = await removePayment(paymentId);
    if (result.success) {
      fetchData();
    }
  }

  const percentCollected = summary && summary.totalExpected > 0
    ? Math.round((summary.totalCollected / summary.totalExpected) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Track monthly contributor payments
          </p>
        </div>
        <Link href="/payments/reminders">
          <Button variant="outline" size="sm">
            Send Reminders
          </Button>
        </Link>
      </div>

      {/* Month/Year Selector */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-lg font-semibold min-w-[180px] text-center">
          {MONTH_NAMES[month - 1]} {year}
        </div>
        <Button variant="outline" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Expected"
            value={formatCurrency(summary.totalExpected)}
            subtitle={`${summary.totalContributors} contributors`}
            icon={<IndianRupee className="h-4 w-4" />}
          />
          <SummaryCard
            title="Collected"
            value={formatCurrency(summary.totalCollected)}
            subtitle={`${summary.paidCount} paid`}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <SummaryCard
            title="Pending"
            value={formatCurrency(summary.totalPending)}
            subtitle={`${summary.unpaidCount} unpaid`}
            icon={<XCircle className="h-4 w-4" />}
          />
          <SummaryCard
            title="Collection Rate"
            value={`${percentCollected}%`}
            subtitle={`${summary.paidCount}/${summary.totalContributors}`}
            icon={<CreditCard className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Payment Grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading payments...
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No active contributors found. Add contributors first.
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.contributor._id}>
                  <TableCell className="font-medium">
                    {row.contributor.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {row.contributor.phone}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.contributor.fixedMonthlyAmount)}
                  </TableCell>
                  <TableCell>
                    {row.payment ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Paid {new Date(row.payment.paidAt).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Unpaid
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.payment ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUndo(row.payment!._id)}
                      >
                        <Undo2 className="mr-1 h-3 w-3" />
                        Undo
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          openPaymentDialog(
                            row.contributor._id,
                            row.contributor.name,
                            row.contributor.fixedMonthlyAmount
                          )
                        }
                      >
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedContributor?.name} — {MONTH_NAMES[month - 1]} {year}
            </DialogDescription>
          </DialogHeader>

          <form action={handleRecordPayment}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  defaultValue={selectedContributor?.amount}
                  min={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidAt">Payment Date</Label>
                <Input
                  id="paidAt"
                  name="paidAt"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select name="method" defaultValue="cash">
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  name="note"
                  placeholder="Any additional notes..."
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
