// server/models/PasswordResetToken.ts
import type { Model, Document } from 'mongoose'
import { Schema, model } from 'mongoose'

export interface IPasswordResetToken extends Document {
  userId: Schema.Types.ObjectId
  token: string
  expiresAt: Date
  used: boolean
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: '1h' } },
  used: { type: Boolean, default: false }
})

export const PasswordResetToken: Model<IPasswordResetToken>
  = model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema)
