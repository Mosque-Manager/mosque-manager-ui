import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type MemberRole = 'admin' | 'treasurer' | 'imam' | 'member';

export interface IMosqueMember extends Document {
  mosqueId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
}

const MosqueMemberSchema = new Schema<IMosqueMember>({
  mosqueId: {
    type: Schema.Types.ObjectId,
    ref: 'Mosque',
    required: [true, 'Mosque ID is required'],
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  role: {
    type: String,
    enum: ['admin', 'treasurer', 'imam', 'member'],
    required: [true, 'Role is required'],
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

MosqueMemberSchema.index({ mosqueId: 1, userId: 1 }, { unique: true });
MosqueMemberSchema.index({ userId: 1 });

const MosqueMember: Model<IMosqueMember> =
  mongoose.models.MosqueMember ||
  mongoose.model<IMosqueMember>('MosqueMember', MosqueMemberSchema);

export default MosqueMember;
