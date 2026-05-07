// ============================================================================
// Verification Service Tests
// ============================================================================
// Vitest unit tests for VerificationService functionality
//
// Tests cover:
// - Code generation
// - Email sending (mocked)
// - SMS sending (mocked)
// - Code validation
// - Code expiration
// - GDPR compliance (phone anonymization)
//
// ============================================================================

import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll, vi } from 'vitest'
import mongoose from 'mongoose'

import { VerificationCode } from '../../server/models/VerificationCode'
import { generateVerificationCode, validateVerificationCode, isCodeUsed } from '../../server/services/verificationService'

// ============================================================================
// Test Database Connection
// ============================================================================

const TEST_DB_URL = 'mongodb://localhost:27017/test_verification_service'

async function connectToTestDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URL)
  }
}

async function clearTestDatabase() {
  await VerificationCode.deleteMany({})
}

async function disconnectTestDatabase() {
  await mongoose.disconnect()
}

// ============================================================================
// Mock External Services
// ============================================================================

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
    })
  }
}))

// Mock Twilio
vi.mock('twilio', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: 'test-sms-sid' })
    }
  }))
}))

// Mock useRuntimeConfig
vi.mock('#app/nuxt/kit', () => ({
  useRuntimeConfig: vi.fn(() => ({
    smtp: {
      host: 'localhost',
      port: 465,
      secure: true,
      user: 'test@test.com',
      password: 'test-pass',
      fromEmail: 'test@test.com',
      fromName: 'Test'
    },
    twilioSid: 'test-sid',
    twilioToken: 'test-token',
    twilioWhatsAppFrom: '+1234567890'
  }))
}))

// ============================================================================
// VerificationService Tests
// ============================================================================

describe('VerificationService', () => {
  beforeAll(async () => {
    await connectToTestDatabase()
  })

  beforeEach(async () => {
    await clearTestDatabase()
  })

  afterEach(async () => {
    await clearTestDatabase()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  describe('generateVerificationCode', () => {
    it('should generate code with email method', async () => {
      const result = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        method: 'email'
      })

      expect(result.success).toBe(true)
      expect(result.code).toBeDefined()
      expect(result.code).toMatch(/^[0-9]{6}$/)
      expect(result.expiresAt).toBeDefined()
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    it('should generate code with SMS method', async () => {
      const result = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        phone: '+3461234567890',
        method: 'sms'
      })

      expect(result.success).toBe(true)
      expect(result.code).toBeDefined()
      expect(result.expiresAt).toBeDefined()
    })

    it('should generate code with both methods', async () => {
      const result = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        phone: '+3461234567890',
        method: 'both'
      })

      expect(result.success).toBe(true)
      expect(result.code).toBeDefined()
    })

    it('should store phone as last 4 digits only (GDPR)', async () => {
      const fullPhone = '+3461234567890'
      const result = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        phone: fullPhone,
        method: 'sms'
      })

      expect(result.success).toBe(true)

      // Check database record
      const verification = await VerificationCode.findOne({ code: result.code })
      expect(verification).toBeDefined()
      expect(verification!.phone).toBe('7890') // Only last 4 digits
      expect(verification!.phone).not.toBe(fullPhone)
    })

    it('should reject request without email or phone', async () => {
      const result = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        method: 'email'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('email o teléfono')
    })

    it('should set expiration to 15 minutes from now', async () => {
      const now = new Date()
      const result = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        method: 'email'
      })

      expect(result.success).toBe(true)

      const expirationDate = new Date(result.expiresAt!)
      const timeDiff = expirationDate.getTime() - now.getTime()
      const expectedDiff = 15 * 60 * 1000 // 15 minutes

      // Allow 1 second tolerance
      expect(Math.abs(timeDiff - expectedDiff)).toBeLessThan(1000)
    })
  })

  describe('validateVerificationCode', () => {
    it('should validate correct code', async () => {
      const generateResult = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        method: 'email'
      })

      const validateResult = await validateVerificationCode(
        generateResult.code!,
        '507f1f77bcf86cd799439011'
      )

      expect(validateResult.success).toBe(true)
      expect(validateResult.verified).toBe(true)
    })

    it('should reject invalid code', async () => {
      const validateResult = await validateVerificationCode(
        '000000',
        '507f1f77bcf86cd799439011'
      )

      expect(validateResult.success).toBe(false)
      expect(validateResult.verified).toBe(false)
      expect(validateResult.error).toBeDefined()
    })

    it('should reject already verified code', async () => {
      const generateResult = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        method: 'email'
      })

      // First validation
      await validateVerificationCode(
        generateResult.code!,
        '507f1f77bcf86cd799439011'
      )

      // Try to validate again
      const validateResult = await validateVerificationCode(
        generateResult.code!,
        '507f1f77bcf86cd799439011'
      )

      expect(validateResult.success).toBe(false)
      expect(validateResult.verified).toBe(false)
    })

    it('should reject code for wrong obraId', async () => {
      const generateResult = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        method: 'email'
      })

      const validateResult = await validateVerificationCode(
        generateResult.code!,
        '507f1f77bcf86cd799439012' // Different obraId
      )

      expect(validateResult.success).toBe(false)
      expect(validateResult.verified).toBe(false)
    })
  })

  describe('isCodeUsed', () => {
    it('should return false for unused code', async () => {
      const generateResult = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        method: 'email'
      })

      const isUsed = await isCodeUsed(
        generateResult.code!,
        '507f1f77bcf86cd799439011'
      )

      expect(isUsed).toBe(false)
    })

    it('should return true for verified code', async () => {
      const generateResult = await generateVerificationCode({
        obraId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        method: 'email'
      })

      // Verify the code
      await validateVerificationCode(
        generateResult.code!,
        '507f1f77bcf86cd799439011'
      )

      const isUsed = await isCodeUsed(
        generateResult.code!,
        '507f1f77bcf86cd799439011'
      )

      expect(isUsed).toBe(true)
    })

    it('should return false for non-existent code', async () => {
      const isUsed = await isCodeUsed(
        '000000',
        '507f1f77bcf86cd799439011'
      )

      expect(isUsed).toBe(false)
    })
  })
})
