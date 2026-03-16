import { z } from 'zod';

export const createMosqueSchema = z.object({
  name: z.string().min(2, 'Mosque name must be at least 2 characters').max(200),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\d{10,15}$/, 'Phone must be 10-15 digits')
    .optional()
    .or(z.literal('')),
});

export type CreateMosqueInput = z.infer<typeof createMosqueSchema>;
