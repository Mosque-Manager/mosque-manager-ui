import { z } from 'zod';

export const contributorSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone must be less than 15 digits')
    .regex(/^\d+$/, 'Phone must contain only digits'),
  fixedMonthlyAmount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be a positive number'),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type ContributorFormData = z.infer<typeof contributorSchema>;
