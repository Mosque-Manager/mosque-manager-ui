'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getUnpaidContributors } from '@/lib/actions/payment';
import {
  formatCurrency,
  generateWhatsAppLink,
  generateReminderMessage,
  getMonthName,
} from '@/lib/utils';
import type { ContributorData } from '@/types';
import { Button } from '@/components/ui/button';
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
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MessageCircle,
  Send,
} from 'lucide-react';

interface RemindersClientProps {
  initialMonth: number;
  initialYear: number;
  mosqueName: string;
  lang: 'en' | 'hi' | 'ur';
}

export default function RemindersClient({
  initialMonth,
  initialYear,
  mosqueName,
  lang,
}: RemindersClientProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [unpaid, setUnpaid] = useState<ContributorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendIndex, setSendIndex] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUnpaidContributors(month, year);
      setUnpaid(data);
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

  function getWhatsAppUrl(contributor: ContributorData): string {
    const message = generateReminderMessage(
      mosqueName,
      contributor.fixedMonthlyAmount,
      month,
      year,
      lang
    );
    return generateWhatsAppLink(contributor.phone, message);
  }

  function handleSendAll() {
    if (unpaid.length === 0) return;
    setSendingAll(true);
    setSendIndex(0);
    // Open first WhatsApp link
    window.open(getWhatsAppUrl(unpaid[0]), '_blank');
  }

  function handleSendNext() {
    const nextIndex = sendIndex + 1;
    if (nextIndex < unpaid.length) {
      setSendIndex(nextIndex);
      window.open(getWhatsAppUrl(unpaid[nextIndex]), '_blank');
    } else {
      // All done
      setSendingAll(false);
      setSendIndex(0);
    }
  }

  function handleCancelSendAll() {
    setSendingAll(false);
    setSendIndex(0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
          <p className="text-muted-foreground">
            Send WhatsApp reminders to unpaid contributors
          </p>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-lg font-semibold min-w-[180px] text-center">
          {getMonthName(month, lang)} {year}
        </div>
        <Button variant="outline" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Send All bar */}
      {!loading && unpaid.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <span className="font-semibold">{unpaid.length}</span>{' '}
            <span className="text-muted-foreground">unpaid contributors</span>
          </div>
          {sendingAll ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Sent {sendIndex + 1} of {unpaid.length}
              </span>
              {sendIndex + 1 < unpaid.length ? (
                <Button size="sm" onClick={handleSendNext}>
                  <Send className="mr-2 h-3 w-3" />
                  Next: {unpaid[sendIndex + 1]?.name}
                </Button>
              ) : (
                <Badge variant="default" className="bg-green-600">All sent!</Badge>
              )}
              <Button size="sm" variant="outline" onClick={handleCancelSendAll}>
                Stop
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleSendAll}>
              <Send className="mr-2 h-4 w-4" />
              Send All Reminders
            </Button>
          )}
        </div>
      )}

      {/* Unpaid Contributors List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading...
        </div>
      ) : unpaid.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          🎉 All contributors have paid for {getMonthName(month, lang)} {year}!
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unpaid.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.phone}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(c.fixedMonthlyAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={getWhatsAppUrl(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="text-green-600">
                        <MessageCircle className="mr-1 h-3 w-3" />
                        WhatsApp
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
