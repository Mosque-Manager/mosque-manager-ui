'use server';

import dbConnect from '@/lib/db';
import Contributor from '@/lib/models/Contributor';
import { requireRole, getMosqueId } from '@/lib/rbac';
import { contributorSchema } from '@/lib/validations/contributor';
import type { ActionResponse, ContributorData } from '@/types';

function toContributorData(doc: Record<string, unknown>): ContributorData {
  return {
    _id: String(doc._id),
    mosqueId: String(doc.mosqueId),
    name: doc.name as string,
    phone: doc.phone as string,
    fixedMonthlyAmount: doc.fixedMonthlyAmount as number,
    address: doc.address as string | undefined,
    isActive: doc.isActive as boolean,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

export interface ContributorFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
}

export interface ContributorListResult {
  contributors: ContributorData[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getContributors(
  filters: ContributorFilters = {}
): Promise<ContributorListResult> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  await dbConnect();

  const { search, status = 'active', page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = { mosqueId };

  if (status !== 'all') {
    query.isActive = status === 'active';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [contributors, total] = await Promise.all([
    Contributor.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Contributor.countDocuments(query),
  ]);

  return {
    contributors: contributors.map(toContributorData),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getContributor(
  id: string
): Promise<ContributorData | null> {
  const user = await requireRole(['admin', 'member']);
  const mosqueId = getMosqueId(user);

  await dbConnect();

  const contributor = await Contributor.findOne({
    _id: id,
    mosqueId,
  }).lean();

  if (!contributor) return null;

  return toContributorData(contributor);
}

export async function createContributor(
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  const raw = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    fixedMonthlyAmount: Number(formData.get('fixedMonthlyAmount')),
    address: (formData.get('address') as string) || undefined,
  };

  const parsed = contributorSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await dbConnect();

  // Check for duplicate phone within the same mosque
  const existing = await Contributor.findOne({
    mosqueId,
    phone: parsed.data.phone,
    isActive: true,
  });

  if (existing) {
    return {
      success: false,
      message: 'A contributor with this phone number already exists in this mosque',
    };
  }

  await Contributor.create({
    mosqueId,
    name: parsed.data.name,
    phone: parsed.data.phone,
    fixedMonthlyAmount: parsed.data.fixedMonthlyAmount,
    address: parsed.data.address || undefined,
  });

  return {
    success: true,
    message: 'Contributor added successfully!',
  };
}

export async function updateContributor(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  const raw = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    fixedMonthlyAmount: Number(formData.get('fixedMonthlyAmount')),
    address: (formData.get('address') as string) || undefined,
  };

  const parsed = contributorSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await dbConnect();

  // Check for duplicate phone (excluding current contributor)
  const existing = await Contributor.findOne({
    mosqueId,
    phone: parsed.data.phone,
    isActive: true,
    _id: { $ne: id },
  });

  if (existing) {
    return {
      success: false,
      message: 'A contributor with this phone number already exists in this mosque',
    };
  }

  const contributor = await Contributor.findOneAndUpdate(
    { _id: id, mosqueId },
    {
      name: parsed.data.name,
      phone: parsed.data.phone,
      fixedMonthlyAmount: parsed.data.fixedMonthlyAmount,
      address: parsed.data.address || undefined,
    },
    { new: true }
  );

  if (!contributor) {
    return {
      success: false,
      message: 'Contributor not found',
    };
  }

  return {
    success: true,
    message: 'Contributor updated successfully!',
  };
}

export async function deleteContributor(
  id: string
): Promise<ActionResponse> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  await dbConnect();

  const contributor = await Contributor.findOneAndUpdate(
    { _id: id, mosqueId, isActive: true },
    { isActive: false },
    { new: true }
  );

  if (!contributor) {
    return {
      success: false,
      message: 'Contributor not found',
    };
  }

  return {
    success: true,
    message: 'Contributor deactivated successfully',
  };
}
