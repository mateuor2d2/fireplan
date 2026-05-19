export interface UserQRSettingsDocument {
  userId?: string
  baseUrl?: string
  enabled: boolean
  autoJoin: boolean
  requireApproval: boolean
  autoGenerate?: boolean
  expirationDays?: number
  createdAt?: Date
}
