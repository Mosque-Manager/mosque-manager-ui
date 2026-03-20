'use server';

import dbConnect from '@/lib/db';
import Mosque from '@/lib/models/Mosque';
import MosqueMember from '@/lib/models/MosqueMember';
import { getSessionUser } from '@/lib/rbac';
import { createMosqueSchema } from '@/lib/validations/mosque';
import Contributor from '@/lib/models/Contributor';
import type { ActionResponse, MosqueData, ContributorData } from '@/types';

export async function createMosque(
  formData: FormData
): Promise<ActionResponse> {
  const user = await getSessionUser();

  await dbConnect();

  // Non-super-admin users can only create one mosque
  // Any existing membership (admin OR member) blocks creation
  if (!user.isSuperAdmin) {
    const existingMembership = await MosqueMember.findOne({
      userId: user.id,
    });
    if (existingMembership) {
      return {
        success: false,
        message: 'You are already associated with a mosque. Each user can belong to only one mosque.',
      };
    }
  }

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
  const user = await getSessionUser();
  await dbConnect();

  let mosques;

  if (user.isSuperAdmin) {
    // Super admin sees all mosques
    mosques = await Mosque.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
  } else {
    // Regular users see only mosques they belong to
    const memberships = await MosqueMember.find({ userId: user.id }).lean();
    const mosqueIds = memberships.map((m) => m.mosqueId);
    mosques = await Mosque.find({ _id: { $in: mosqueIds }, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
  }

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

export async function getMosque(id: string): Promise<MosqueData | null> {
  const user = await getSessionUser();
  await dbConnect();

  const mosque = await Mosque.findOne({ _id: id, isActive: true }).lean();
  if (!mosque) return null;

  // Non-super-admin must be a member of this mosque
  if (!user.isSuperAdmin) {
    const membership = await MosqueMember.findOne({
      mosqueId: id,
      userId: user.id,
    });
    if (!membership) return null;
  }

  return {
    _id: mosque._id.toString(),
    name: mosque.name,
    address: mosque.address,
    city: mosque.city,
    phone: mosque.phone,
    createdBy: mosque.createdBy.toString(),
    isActive: mosque.isActive,
    createdAt: mosque.createdAt,
    updatedAt: mosque.updatedAt,
  };
}

export async function getMosqueContributors(
  mosqueId: string
): Promise<ContributorData[]> {
  const user = await getSessionUser();
  await dbConnect();

  // Non-super-admin must be a member of this mosque
  if (!user.isSuperAdmin) {
    const membership = await MosqueMember.findOne({
      mosqueId,
      userId: user.id,
    });
    if (!membership) return [];
  }

  const contributors = await Contributor.find({
    mosqueId,
    isActive: true,
  })
    .sort({ name: 1 })
    .lean();

  return contributors.map((c) => ({
    _id: String(c._id),
    mosqueId: String(c.mosqueId),
    name: c.name,
    phone: c.phone,
    fixedMonthlyAmount: c.fixedMonthlyAmount,
    address: c.address,
    isActive: c.isActive,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}
