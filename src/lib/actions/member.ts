'use server';

import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Invite from '@/lib/models/Invite';
import MosqueMember from '@/lib/models/MosqueMember';
import Mosque from '@/lib/models/Mosque';
import User from '@/lib/models/User';
import { requireRole, getSessionUser, getMosqueId } from '@/lib/rbac';
import { inviteSchema } from '@/lib/validations/member';
import type { ActionResponse } from '@/types';

// ---------- Invite Actions ----------

export async function createInviteLink(
  role: 'admin' | 'member' = 'member'
): Promise<ActionResponse<{ url: string; token: string }>> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  const parsed = inviteSchema.safeParse({ role });
  if (!parsed.success) {
    return { success: false, message: 'Invalid role' };
  }

  await dbConnect();

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await Invite.create({
    mosqueId,
    token,
    role: parsed.data.role,
    expiresAt,
    createdBy: user.id,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';
  const url = `${baseUrl}/invite/${token}`;

  return {
    success: true,
    message: 'Invite link created',
    data: { url, token },
  };
}

export interface InviteDetails {
  mosqueName: string;
  mosqueCity?: string;
  role: 'admin' | 'member';
  expired: boolean;
  used: boolean;
}

export async function getInviteDetails(
  token: string
): Promise<ActionResponse<InviteDetails>> {
  await dbConnect();

  const invite = await Invite.findOne({ token }).lean();
  if (!invite) {
    return { success: false, message: 'Invalid invite link' };
  }

  const mosque = await Mosque.findById(invite.mosqueId).lean();
  if (!mosque || !mosque.isActive) {
    return { success: false, message: 'Mosque not found' };
  }

  const expired = new Date() > invite.expiresAt;
  const used = !!invite.usedBy;

  return {
    success: true,
    message: expired ? 'Invite link has expired' : used ? 'Invite link already used' : 'Valid invite',
    data: {
      mosqueName: mosque.name,
      mosqueCity: mosque.city,
      role: invite.role as 'admin' | 'member',
      expired,
      used,
    },
  };
}

export async function acceptInvite(
  token: string
): Promise<ActionResponse<{ mosqueId: string; role: string }>> {
  const user = await getSessionUser();

  await dbConnect();

  const invite = await Invite.findOne({ token });
  if (!invite) {
    return { success: false, message: 'Invalid invite link' };
  }

  if (new Date() > invite.expiresAt) {
    return { success: false, message: 'Invite link has expired' };
  }

  if (invite.usedBy) {
    return { success: false, message: 'Invite link has already been used' };
  }

  // Check if user is already a member of this mosque
  const existingMembership = await MosqueMember.findOne({
    mosqueId: invite.mosqueId,
    userId: user.id,
  });

  if (existingMembership) {
    return { success: false, message: 'You are already a member of this mosque' };
  }

  // Create membership
  await MosqueMember.create({
    mosqueId: invite.mosqueId,
    userId: user.id,
    role: invite.role,
  });

  // Mark invite as used
  invite.usedBy = user.id as unknown as import('mongoose').Types.ObjectId;
  invite.usedAt = new Date();
  await invite.save();

  return {
    success: true,
    message: 'You have joined the mosque!',
    data: { mosqueId: invite.mosqueId.toString(), role: invite.role },
  };
}

// ---------- Member Management Actions ----------

export interface MemberData {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export async function getMembers(): Promise<MemberData[]> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  await dbConnect();

  const memberships = await MosqueMember.find({ mosqueId }).lean();

  const userIds = memberships.map((m) => m.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return memberships.map((m) => {
    const u = userMap.get(m.userId.toString());
    return {
      _id: m._id.toString(),
      userId: m.userId.toString(),
      name: u?.name || 'Unknown',
      email: u?.email || '',
      phone: u?.phone,
      role: m.role as 'admin' | 'member',
      joinedAt: m.joinedAt,
    };
  });
}

export async function removeMember(
  userId: string
): Promise<ActionResponse> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  if (userId === user.id) {
    return { success: false, message: 'You cannot remove yourself' };
  }

  await dbConnect();

  const membership = await MosqueMember.findOne({
    mosqueId,
    userId,
  });

  if (!membership) {
    return { success: false, message: 'Member not found' };
  }

  // Cannot remove another admin (only self-removal is blocked above)
  if (membership.role === 'admin' && !user.isSuperAdmin) {
    return { success: false, message: 'Cannot remove another admin' };
  }

  await MosqueMember.deleteOne({ _id: membership._id });

  return { success: true, message: 'Member removed successfully' };
}

// ---------- Invite History ----------

export interface InviteHistoryItem {
  _id: string;
  token: string;
  role: 'admin' | 'member';
  expiresAt: Date;
  used: boolean;
  usedByName?: string;
  usedAt?: Date;
  createdAt: Date;
}

export async function getInviteHistory(): Promise<InviteHistoryItem[]> {
  const user = await requireRole(['admin']);
  const mosqueId = getMosqueId(user);

  await dbConnect();

  const invites = await Invite.find({ mosqueId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const usedByIds = invites
    .filter((i) => i.usedBy)
    .map((i) => i.usedBy!);

  const users = usedByIds.length
    ? await User.find({ _id: { $in: usedByIds } }).lean()
    : [];
  const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

  return invites.map((i) => ({
    _id: i._id.toString(),
    token: i.token,
    role: i.role as 'admin' | 'member',
    expiresAt: i.expiresAt,
    used: !!i.usedBy,
    usedByName: i.usedBy ? userMap.get(i.usedBy.toString()) : undefined,
    usedAt: i.usedAt,
    createdAt: i.createdAt,
  }));
}
