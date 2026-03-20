import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IInvite extends Document {
  mosqueId: Types.ObjectId;
  token: string;
  role: 'admin' | 'member';
  expiresAt: Date;
  usedBy?: Types.ObjectId;
  usedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    mosqueId: {
      type: Schema.Types.ObjectId,
      ref: 'Mosque',
      required: [true, 'Mosque ID is required'],
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    usedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  { timestamps: true }
);

InviteSchema.index({ token: 1 }, { unique: true });
InviteSchema.index({ mosqueId: 1 });
InviteSchema.index({ expiresAt: 1 });

const Invite: Model<IInvite> =
  mongoose.models.Invite ||
  mongoose.model<IInvite>('Invite', InviteSchema);

export default Invite;
