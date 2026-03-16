import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContributor extends Document {
  _id: Types.ObjectId;
  mosqueId: Types.ObjectId;
  name: string;
  phone: string;
  fixedMonthlyAmount: number;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContributorSchema = new Schema<IContributor>(
  {
    mosqueId: {
      type: Schema.Types.ObjectId,
      ref: 'Mosque',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    fixedMonthlyAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    address: {
      type: String,
      trim: true,
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

ContributorSchema.index({ mosqueId: 1, isActive: 1 });
ContributorSchema.index({ mosqueId: 1, phone: 1 });

const Contributor =
  mongoose.models.Contributor ||
  mongoose.model<IContributor>('Contributor', ContributorSchema);

export default Contributor;
