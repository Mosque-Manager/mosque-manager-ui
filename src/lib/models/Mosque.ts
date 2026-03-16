import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMosque extends Document {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MosqueSchema = new Schema<IMosque>(
  {
    name: {
      type: String,
      required: [true, 'Mosque name is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

MosqueSchema.index({ createdBy: 1 });

const Mosque: Model<IMosque> =
  mongoose.models.Mosque || mongoose.model<IMosque>('Mosque', MosqueSchema);

export default Mosque;
