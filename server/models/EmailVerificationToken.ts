import type { Model, Document } from 'mongoose'
import { Schema, model } from 'mongoose'

export interface IEmailVerificationToken extends Document {
  userId: Schema.Types.ObjectId
  token: string
  expiresAt: Date
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: '24h' } }
})

export const EmailVerificationToken: Model<IEmailVerificationToken> = model<IEmailVerificationToken>(
  'EmailVerificationToken',
  EmailVerificationTokenSchema
)
