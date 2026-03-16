export type UserRole = 'admin' | 'member';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  mosqueId?: string;
  role?: UserRole;
  lang: 'en' | 'hi' | 'ur';
}

export interface MosqueData {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MosqueMemberData {
  _id: string;
  mosqueId: string;
  userId: string;
  role: UserRole;
  joinedAt: Date;
}

export interface ActionResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface ContributorData {
  _id: string;
  mosqueId: string;
  name: string;
  phone: string;
  fixedMonthlyAmount: number;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
