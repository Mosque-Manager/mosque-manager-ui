'use server';

import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import Contributor from '@/lib/models/Contributor';
import { requireRole, getMosqueId } from '@/lib/rbac';
import { paymentSchema } from '@/lib/validations/payment';
import type {
  ActionResponse,
  PaymentData,
  MonthlyPaymentRow,
  PaymentSummary,
} from '@/types';

function toPaymentData(doc: Record<string, unknown>): PaymentData {
  return {
    _id: String(doc._id),
    mosqueId: String(doc.mosqueId),
    contributorId: String(doc.contributorId),
    amount: doc.amount as number,
    month: doc.month as number,
    year: doc.year as number,
    paidAt: doc.paidAt as Date,
    method: doc.method as PaymentData['method'],
    note: doc.note as string | undefined,
    recordedBy: String(doc.recordedBy),
    createdAt: doc.createdAt as Date,
  };
}

/**
 * Get all contributors with their payment status for a given month/year.
 */
export async function getMonthlyPayments(
  month: number,
  year: number
): Promise<MonthlyPaymentRow[]> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  await dbConnect();

  const mosqueObjId = new mongoose.Types.ObjectId(mosqueId);

  const [contributors, payments] = await Promise.all([
    Contributor.find({ mosqueId: mosqueObjId, isActive: true })
      .sort({ name: 1 })
      .lean(),
    Payment.find({ mosqueId: mosqueObjId, month, year }).lean(),
  ]);

  const paymentMap = new Map(
    payments.map((p) => [String(p.contributorId), toPaymentData(p as Record<string, unknown>)])
  );

  return contributors.map((c) => ({
    contributor: {
      _id: String(c._id),
      mosqueId: String(c.mosqueId),
      name: c.name,
      phone: c.phone,
      fixedMonthlyAmount: c.fixedMonthlyAmount,
      address: c.address,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    },
    payment: paymentMap.get(String(c._id)) || null,
  }));
}

/**
 * Get payment summary stats for a given month/year.
 */
export async function getPaymentSummary(
  month: number,
  year: number
): Promise<PaymentSummary> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  await dbConnect();

  const mosqueObjId = new mongoose.Types.ObjectId(mosqueId);

  const [contributors, payments] = await Promise.all([
    Contributor.find({ mosqueId: mosqueObjId, isActive: true }).lean(),
    Payment.find({ mosqueId: mosqueObjId, month, year }).lean(),
  ]);

  const totalExpected = contributors.reduce(
    (sum, c) => sum + c.fixedMonthlyAmount,
    0
  );
  const totalCollected = payments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  return {
    totalExpected,
    totalCollected,
    totalPending: totalExpected - totalCollected,
    paidCount: payments.length,
    unpaidCount: contributors.length - payments.length,
    totalContributors: contributors.length,
  };
}

/**
 * Record a payment for a contributor.
 */
export async function recordPayment(
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  const raw = {
    contributorId: formData.get('contributorId') as string,
    amount: Number(formData.get('amount')),
    month: Number(formData.get('month')),
    year: Number(formData.get('year')),
    paidAt: formData.get('paidAt') as string,
    method: formData.get('method') as string,
    note: (formData.get('note') as string) || '',
  };

  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await dbConnect();

  // Verify contributor belongs to this mosque
  const contributor = await Contributor.findOne({
    _id: parsed.data.contributorId,
    mosqueId,
    isActive: true,
  });

  if (!contributor) {
    return {
      success: false,
      message: 'Contributor not found',
    };
  }

  // Check for duplicate payment (unique index will also catch this)
  const existing = await Payment.findOne({
    mosqueId,
    contributorId: parsed.data.contributorId,
    month: parsed.data.month,
    year: parsed.data.year,
  });

  if (existing) {
    return {
      success: false,
      message: 'Payment already recorded for this contributor for this month',
    };
  }

  await Payment.create({
    mosqueId,
    contributorId: parsed.data.contributorId,
    amount: parsed.data.amount,
    month: parsed.data.month,
    year: parsed.data.year,
    paidAt: new Date(parsed.data.paidAt),
    method: parsed.data.method,
    note: parsed.data.note || undefined,
    recordedBy: user.id,
  });

  return {
    success: true,
    message: 'Payment recorded successfully!',
  };
}

/**
 * Remove (undo) a payment record.
 */
export async function removePayment(
  paymentId: string
): Promise<ActionResponse> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  await dbConnect();

  const payment = await Payment.findOneAndDelete({
    _id: paymentId,
    mosqueId,
  });

  if (!payment) {
    return {
      success: false,
      message: 'Payment not found',
    };
  }

  return {
    success: true,
    message: 'Payment removed successfully',
  };
}

/**
 * Get payment history for a specific contributor.
 */
export async function getContributorPayments(
  contributorId: string
): Promise<PaymentData[]> {
  const user = await requireRole(['admin', 'member']);
  const mosqueId = getMosqueId(user);

  await dbConnect();

  const payments = await Payment.find({
    mosqueId,
    contributorId,
  })
    .sort({ year: -1, month: -1 })
    .lean();

  return payments.map((p) => toPaymentData(p as Record<string, unknown>));
}

/**
 * Get dashboard payment summary for the current month (used on dashboard page).
 */
export async function getDashboardPaymentSummary(
  mosqueId: string,
  month: number,
  year: number
): Promise<PaymentSummary> {
  await dbConnect();

  const mosqueObjId = new mongoose.Types.ObjectId(mosqueId);

  const [contributors, payments] = await Promise.all([
    Contributor.find({ mosqueId: mosqueObjId, isActive: true }).lean(),
    Payment.find({ mosqueId: mosqueObjId, month, year }).lean(),
  ]);

  const totalExpected = contributors.reduce(
    (sum, c) => sum + c.fixedMonthlyAmount,
    0
  );
  const totalCollected = payments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  return {
    totalExpected,
    totalCollected,
    totalPending: totalExpected - totalCollected,
    paidCount: payments.length,
    unpaidCount: contributors.length - payments.length,
    totalContributors: contributors.length,
  };
}
