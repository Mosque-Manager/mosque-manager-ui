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

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other';

export interface PaymentData {
  _id: string;
  mosqueId: string;
  contributorId: string;
  amount: number;
  month: number;
  year: number;
  paidAt: Date;
  method: PaymentMethod;
  note?: string;
  recordedBy: string;
  createdAt: Date;
}

export interface PaymentWithContributor extends PaymentData {
  contributorName: string;
  contributorPhone: string;
  fixedMonthlyAmount: number;
}

export interface MonthlyPaymentRow {
  contributor: ContributorData;
  payment: PaymentData | null;
}

export interface PaymentSummary {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  paidCount: number;
  unpaidCount: number;
  totalContributors: number;
}
