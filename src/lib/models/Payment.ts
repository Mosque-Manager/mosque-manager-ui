import mongoose, { Schema, Document, Types } from 'mongoose';

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  mosqueId: Types.ObjectId;
  contributorId: Types.ObjectId;
  amount: number;
  month: number;
  year: number;
  paidAt: Date;
  method: PaymentMethod;
  note?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    mosqueId: {
      type: Schema.Types.ObjectId,
      ref: 'Mosque',
      required: true,
    },
    contributorId: {
      type: Schema.Types.ObjectId,
      ref: 'Contributor',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    paidAt: {
      type: Date,
      required: true,
    },
    method: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'other'],
      default: 'cash',
    },
    note: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ mosqueId: 1, month: 1, year: 1 });
PaymentSchema.index(
  { mosqueId: 1, contributorId: 1, month: 1, year: 1 },
  { unique: true }
);

const Payment =
  mongoose.models.Payment ||
  mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
