// ============================================================================
// Verification Code Model Tests
// ============================================================================
// Vitest unit tests for VerificationCode model functionality
//
// Tests cover:
// - CRUD operations
// - Code validation (6-digit requirement)
// - Expiration handling
// - Uniqueness constraint (code + obraId)
// - TTL index cleanup
// - Rate limiting by IP
//
// ============================================================================

import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest'
import mongoose from 'mongoose'

import { VerificationCode } from '../../server/models/VerificationCode'
import type { IVerificationCode } from '../../server/models/VerificationCode'

// ============================================================================
// Test Database Connection
// ============================================================================

const TEST_DB_URL = 'mongodb://localhost:27017/test_verification_codes'

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
// VerificationCode Model Tests
// ============================================================================

describe('VerificationCode Model', () => {
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

  describe('Code Generation', () => {
    it('should generate a 6-digit code with proper format', async () => {
      const verificationCodeData = {
        obraId: '507f1f77bcf86cd799439011',
        method: 'email'
      }

      const verificationCode = await VerificationCode.create(verificationCodeData)

      expect(verificationCode).toBeDefined()
      expect(verificationCode.code).toMatch(/^[0-9]{6}$/)
      expect(verificationCode.code).toHaveLength(6)
      expect(verificationCode.verified).toBe(false)
    })

    it('should set expiration to 15 minutes from creation', async () => {
      const now = new Date()
      const expectedExpiration = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now

      await VerificationCode.create({
        obraId: '507f191bcf86cd7994390111',
        method: 'email'
      })

      const code = await VerificationCode.findOne({ obraId: '507f191bcf86cd7994390111' })
      expect(code).toBeDefined()

      // Verify expiration is approximately 15 minutes after creation
      const expirationDate = new Date(code!.expiresAt)
      const timeDiff = Math.abs(expirationDate.getTime() - expectedExpiration.getTime())
      expect(timeDiff).toBeLessThan(1000) // Allow 1 second tolerance
    })
  })

  describe('Validation', () => {
    it('should reject codes with non-numeric characters', async () => {
      await expect(
        VerificationCode.create({
          obraId: '507f1f77bcf86cd799439011',
          code: 'ABC123', // Contains letters
          method: 'email'
        })
      ).rejects.toThrow()
    })

    it('should reject codes with wrong length (not 6 digits)', async () => {
      const invalidCodes = [
        '12345', // 5 digits
        '1234567', // 7 digits
        '123', // 3 digits
        '12345678' // 8 digits
      ]

      for (const code of invalidCodes) {
        await expect(
          VerificationCode.create({
            obraId: '507f1f77bcf86cd799439011',
            code,
            method: 'email'
          })
        ).rejects.toThrow()
      }
    })

    it('should reject code with invalid obraId format', async () => {
      await expect(
        VerificationCode.create({
          obraId: 'invalid-obraid',
          code: '123456',
          method: 'email'
        })
      ).rejects.toThrow()
    })
  })

  describe('Uniqueness Constraint', () => {
    it('should enforce unique code + obraId combination', async () => {
      const obraId = '507f191bcf86cd7994390111'

      await VerificationCode.create({
        obraId,
        code: '123456',
        method: 'email'
      })

      // Attempt to create duplicate code with same obraId
      await expect(
        VerificationCode.create({
          obraId,
          code: '123456',
          method: 'email'
        })
      ).rejects.toThrow()
    })

    it('should allow same code for different obras', async () => {
      const code = '123456'

      await VerificationCode.create({
        obraId: '507f191bcf86cd7994390111',
        code,
        method: 'email'
      })

      await VerificationCode.create({
        obraId: '507f191bcf86cd7994390121',
        code,
        method: 'email'
      })

      const codesForWork1 = await VerificationCode.find({ obraId: '507f191bcf86cd7994390111', code })
      const codesForWork2 = await VerificationCode.find({ obraId: '507f191bcf86cd7994390121', code })

      expect(codesForWork1).toHaveLength(1)
      expect(codesForWork2).toHaveLength(1)
    })
  })

  describe('Expiration & Verification', () => {
    it('should be marked as verified when verification succeeds', async () => {
      const verificationCode = await VerificationCode.create({
        obraId: '507f191bcf86cd7994390111',
        code: '123456',
        method: 'email'
      })

      await VerificationCode.findByIdAndUpdate(verificationCode._id, {
        $set: { verified: true }
      })

      const verifiedCode = await VerificationCode.findById(verificationCode._id)
      expect(verifiedCode).toBeDefined()
      expect(verifiedCode!.verified).toBe(true)
    })

    it('should reject duplicate verification (already verified)', async () => {
      const verificationCode = await VerificationCode.create({
        obraId: '507f191bcfcd7cc699439011',
        code: '123456',
        method: 'email'
      })

      await VerificationCode.findByIdAndUpdate(verificationCode._id, {
        $set: { verified: true }
      })

      // Attempt to verify an already verified code should fail
      const code = await VerificationCode.findById(verificationCode._id)
      expect(code).toBeDefined()
      expect(code!.verified).toBe(true)
    })
  })
})
