import type { Document, Model } from 'mongoose'
import { Schema, model } from 'mongoose'

export interface IInvitation extends Document {
  email: string
  obraId: string
  obraName: string
  invitedBy: string
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: Date
}

const InvitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    obraId: {
      type: Schema.Types.ObjectId,
      ref: 'Planes',
      required: true,
      index: true
    },
    obraName: {
      type: String,
      required: true
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending'
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
)

InvitationSchema.index({ email: 1, obraId: 1, status: 1 })

export const Invitation: Model<IInvitation> = model<IInvitation>('Invitation', InvitationSchema)
