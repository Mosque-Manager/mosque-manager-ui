import { z } from 'zod';

export const inviteSchema = z.object({
  role: z.enum(['admin', 'member']).default('member'),
});

export type InviteInput = z.infer<typeof inviteSchema>;
