import { z } from 'zod';

export const paymentSchema = z.object({
  contributorId: z.string().min(1, 'Contributor is required'),
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be a positive number'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  paidAt: z.string().min(1, 'Payment date is required'),
  method: z.enum(['cash', 'upi', 'bank_transfer', 'other']),
  note: z
    .string()
    .max(500, 'Note must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
