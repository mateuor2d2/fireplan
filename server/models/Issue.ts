import type { Document } from 'mongoose'
import { Schema, model } from 'mongoose'

export interface IIssue extends Document {
  obraId: string
  title: string
  description: string
  type: 'annotation' | 'comment' | 'accident'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo?: string[]
  createdBy: string
  referenceNumber?: string
  verified?: 'code' | 'pending'
  createdAt: Date
  updatedAt: Date
  photos: {
    id: string
    url: string
    caption?: string
    uploadedAt: Date
  }[]
  comments: {
    id: string
    userId: string
    userName: string
    text: string
    createdAt: Date
  }[]
}

const IssueSchema = new Schema<IIssue>({
  obraId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['annotation', 'comment', 'accident'],
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: [{ type: String }],
  createdBy: { type: String, required: true },
  referenceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  verified: {
    type: String,
    enum: ['code', 'pending'],
    default: 'pending'
  },
  photos: [{
    id: String,
    url: String,
    caption: String,
    uploadedAt: Date
  }],
  comments: [{
    id: String,
    userId: String,
    userName: String,
    text: String,
    createdAt: Date
  }]
}, {
  timestamps: true
})

IssueSchema.index({ obraId: 1, createdAt: -1 })

export const Issue = model<IIssue>('Issue', IssueSchema)
