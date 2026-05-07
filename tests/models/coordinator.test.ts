// ============================================================================
// Coordinator Model Unit Tests
// ============================================================================
// Vitest unit tests for Coordinator model functionality
//
// Tests cover:
// - CRUD operations
// - Index functionality
// - Validation (email uniqueness, phone format, obraId format)
// - SMS control feature
// - Active/inactive functionality
//
// ============================================================================

import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest'
import mongoose from 'mongoose'

// Import models
import { Coordinator } from '../../server/models/Coordinator'
import { VerificationCode } from '../../server/models/VerificationCode'

// ============================================================================
// Test Database Connection
// ============================================================================

const TEST_DB_URL = 'mongodb://localhost:27017/test_coordinators'

async function connectToTestDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URL)
  }
}

async function clearTestDatabase() {
  await Coordinator.deleteMany({})
  await VerificationCode.deleteMany({})
}

async function disconnectTestDatabase() {
  await mongoose.disconnect()
}

// ============================================================================
// Coordinator Model Tests
// ============================================================================

describe('Coordinator Model', () => {
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

  describe('CRUD Operations', () => {
    it('should create a coordinator with valid data', async () => {
      const coordinatorData = {
        obraId: '507f1f77bcf86cd799439011',
        name: 'Juan García',
        cargo: 'Coordinador de seguridad',
        email: 'juan.garcia@example.com',
        phone: '+3461234567890'
      }

      const coordinator = await Coordinator.create(coordinatorData)

      expect(coordinator).toBeDefined()
      expect(coordinator._id).toBeDefined()
      expect(coordinator.obraId).toBe(coordinatorData.obraId)
      expect(coordinator.name).toBe(coordinatorData.name)
      expect(coordinator.cargo).toBe(coordinatorData.cargo)
      expect(coordinator.email).toBe(coordinatorData.email.toLowerCase())
      expect(coordinator.phone).toBe(coordinatorData.phone)
      expect(coordinator.smsEnabled).toBe(false)
      expect(coordinator.active).toBe(true)
    })

    it('should prevent duplicate email addresses', async () => {
      const obraId = '507f1f77bcf86cd799439011'
      const email = 'test@example.com'

      // Create first coordinator
      await Coordinator.create({
        obraId,
        name: 'Test 1',
        cargo: 'Cargo 1',
        email,
        phone: '+3461234567890'
      })

      // Attempt to create second coordinator with same email (different work)
      await expect(
        Coordinator.create({
          obraId: '507f1f77bcf86cd799439012',
          name: 'Test 2',
          cargo: 'Cargo 2',
          email,
          phone: '+3461234567891'
        })
      ).rejects.toThrow()
    })

    it('should create multiple coordinators for the same obraId', async () => {
      const obraId = '507f1f77bcf86cd799439011'

      const coordinator1 = await Coordinator.create({
        obraId,
        name: 'Primer coordinador',
        cargo: 'Coordinador de seguridad',
        email: 'coordinator1@example.com',
        phone: '+3461234567890'
      })

      const coordinator2 = await Coordinator.create({
        obraId,
        name: 'Segundo coordinador',
        cargo: 'Responsable de prevención',
        email: 'coordinator2@example.com',
        phone: '+3461234567891'
      })

      const coordinators = await Coordinator.find({ obraId })

      expect(coordinators).toHaveLength(2)
      expect(coordinators[0].name).toBe('Primer coordinador')
      expect(coordinators[1].name).toBe('Segundo coordinador')
    })

    it('should update coordinator data', async () => {
      const coordinator = await Coordinator.create({
        obraId: '507f1f77bcf86cd799439011',
        name: 'Test User',
        cargo: 'Cargo de prueba',
        email: 'test@example.com',
        phone: '+3461234567890'
      })

      const updatedCoordinator = await Coordinator.findByIdAndUpdate(
        coordinator._id,
        {
          $set: {
            smsEnabled: true
          }
        },
        { new: true }
      )

      expect(updatedCoordinator).toBeDefined()
      expect(updatedCoordinator!.smsEnabled).toBe(true)

      const fetchedCoordinator = await Coordinator.findById(coordinator._id)
      expect(fetchedCoordinator).toBeDefined()
      expect(fetchedCoordinator!.smsEnabled).toBe(true)
    })

    it('should soft delete coordinator by setting active to false', async () => {
      const coordinator = await Coordinator.create({
        obraId: '507f1f77bcf86cd799439011',
        name: 'Test User',
        cargo: 'Cargo de prueba',
        email: 'softdelete@example.com',
        phone: '+3461234567890'
      })

      await Coordinator.findByIdAndUpdate(
        coordinator._id,
        {
          $set: {
            active: false
          }
        }
      )

      const updatedCoordinator = await Coordinator.findById(coordinator._id)
      expect(updatedCoordinator).toBeDefined()
      expect(updatedCoordinator!.active).toBe(false)

      const activeCoordinators = await Coordinator.find({ obraId: '507f1f77bcf86cd799439011', active: true })
      expect(activeCoordinators).toHaveLength(0)
    })
  })

  describe('Validation', () => {
    it('should reject coordinator with invalid obraId format', async () => {
      await expect(
        Coordinator.create({
          obraId: 'invalid-obraid',
          name: 'Test User',
          cargo: 'Cargo',
          email: 'test@example.com',
          phone: '+3461234567890'
        })
      ).rejects.toThrow()
    })

    it('should reject coordinator with too short name', async () => {
      await expect(
        Coordinator.create({
          obraId: '507f1f77bcf86cd799439011',
          name: '', // Too short
          cargo: 'Cargo',
          email: 'test@example.com',
          phone: '+3461234567890'
        })
      ).rejects.toThrow()
    })

    it('should reject coordinator with invalid email format', async () => {
      await expect(
        Coordinator.create({
          obraId: '507f1f77bcf86cd799439011',
          name: 'Test User',
          cargo: 'Cargo',
          email: 'invalid-email',
          phone: '+3461234567890'
        })
      ).rejects.toThrow()
    })

    it('should reject coordinator with invalid phone format', async () => {
      await expect(
        Coordinator.create({
          obraId: '507f1f77bcf86cd799439011',
          name: 'Test User',
          cargo: 'Cargo',
          email: 'test@example.com',
          phone: 'invalid-phone' // Missing country code
        })
      ).rejects.toThrow()
    })
  })

  describe('Phone Number Format', () => {
    it('should accept Spanish mobile format: +34 followed by 9 digits', async () => {
      const coordinator = await Coordinator.create({
        obraId: '507f1f77bcf86cd799439011',
        name: 'Test User',
        cargo: 'Cargo',
        email: 'test@example.com',
        phone: '+346123456789'
      })

      expect(coordinator.phone).toBe('+346123456789')
    })

    it('should accept other international formats', async () => {
      const testCases = [
        { phone: '+3901234567890', email: 'test1@example.com' }, // Italy
        { phone: '+44 7912 345678', email: 'test2@example.com' }, // UK
        { phone: '+1 415-555-0269', email: 'test3@example.com' } // US
      ]

      for (const testCase of testCases) {
        const coordinator = await Coordinator.create({
          obraId: '507f1f77bcf86cd799439011',
          name: 'Test User',
          cargo: 'Cargo',
          email: testCase.email,
          phone: testCase.phone
        })

        expect(coordinator.phone).toBe(testCase.phone)
      }
    })
  })

  describe('Index Functionality', () => {
    it('should find coordinators by obraId', async () => {
      const obraId = '507f1f77bcf86cd799439011'

      await Coordinator.create({
        obraId,
        name: 'Coordinator 1',
        cargo: 'Cargo 1',
        email: 'coordinator1@example.com',
        phone: '+3461234567890'
      })

      await Coordinator.create({
        obraId,
        name: 'Coordinator 2',
        cargo: 'Cargo 2',
        email: 'coordinator2@example.com',
        phone: '+3461234567891'
      })

      const coordinators = await Coordinator.find({ obraId })
      expect(coordinators).toHaveLength(2)
    })

    it('should enforce email uniqueness across all works', async () => {
      await Coordinator.create({
        obraId: '507f1f77bcf86cd799439011',
        name: 'Test User',
        cargo: 'Cargo',
        email: 'unique@example.com',
        phone: '+3461234567890'
      })

      await expect(
        Coordinator.create({
          obraId: '507f1f77bcf86cd799439012',
          name: 'Test User 2',
          cargo: 'Cargo',
          email: 'unique@example.com',
          phone: '+3461234567890'
        })
      ).rejects.toThrow()
    })
  })

  describe('SMS Control', () => {
    it('should create coordinator with SMS disabled by default', async () => {
      const coordinator = await Coordinator.create({
        obraId: '507f1f77bcf86cd799439011',
        name: 'Test User',
        cargo: 'Cargo',
        email: 'sms-default@example.com',
        phone: '+3461234567890'
      })

      expect(coordinator.smsEnabled).toBe(false)
    })

    it('should allow enabling SMS for individual coordinators', async () => {
      const coordinator = await Coordinator.create({
        obraId: '507f1f77bcf86cd799439011',
        name: 'Test User',
        cargo: 'Cargo',
        email: 'sms-enabled@example.com',
        phone: '+3461234567890',
        smsEnabled: true
      })

      expect(coordinator.smsEnabled).toBe(true)
    })
  })
})
