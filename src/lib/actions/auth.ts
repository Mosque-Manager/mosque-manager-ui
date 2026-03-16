'use server';

import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { signUpSchema } from '@/lib/validations/auth';
import type { ActionResponse } from '@/types';

export async function signUp(formData: FormData): Promise<ActionResponse> {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    password: formData.get('password') as string,
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, phone, password } = parsed.data;

  await dbConnect();

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return {
      success: false,
      message: 'An account with this email already exists',
    };
  }

  // Check if this is the first user — auto-assign as super admin
  const userCount = await User.countDocuments();
  const isSuperAdmin = userCount === 0;

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email: email.toLowerCase(),
    phone: phone || undefined,
    passwordHash,
    isSuperAdmin,
  });

  return {
    success: true,
    message: isSuperAdmin
      ? 'Account created! You are the Super Admin.'
      : 'Account created! Please log in.',
  };
}
