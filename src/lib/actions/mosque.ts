'use server';

import dbConnect from '@/lib/db';
import Mosque from '@/lib/models/Mosque';
import MosqueMember from '@/lib/models/MosqueMember';
import { requireSuperAdmin } from '@/lib/rbac';
import { createMosqueSchema } from '@/lib/validations/mosque';
import type { ActionResponse, MosqueData } from '@/types';

export async function createMosque(
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireSuperAdmin();

  const raw = {
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    phone: formData.get('phone') as string,
  };

  const parsed = createMosqueSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await dbConnect();

  const mosque = await Mosque.create({
    name: parsed.data.name,
    address: parsed.data.address || undefined,
    city: parsed.data.city || undefined,
    phone: parsed.data.phone || undefined,
    createdBy: user.id,
  });

  // Auto-assign creator as mosque admin
  await MosqueMember.create({
    mosqueId: mosque._id,
    userId: user.id,
    role: 'admin',
  });

  return {
    success: true,
    message: 'Mosque created successfully!',
  };
}

export async function getMosques(): Promise<MosqueData[]> {
  await requireSuperAdmin();
  await dbConnect();

  const mosques = await Mosque.find({ isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  return mosques.map((m) => ({
    _id: m._id.toString(),
    name: m.name,
    address: m.address,
    city: m.city,
    phone: m.phone,
    createdBy: m.createdBy.toString(),
    isActive: m.isActive,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
}
