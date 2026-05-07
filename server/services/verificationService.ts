// ============================================================================
// Verification Service
// ============================================================================
// Service for generating and validating verification codes for issue reporting
//
// Handles email verification via SMTP, SMS via Twilio, 6-digit time-limited codes,
// code validation/expiration, and GDPR-compliant partial phone storage.
//
// ============================================================================

import nodemailer from 'nodemailer'
import type { IVerificationCode } from '../models/VerificationCode'
import { connectDB } from '../utils/db'

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a verification code generation attempt
 */
export interface VerificationResult {
  success: boolean
  code?: string
  expiresAt?: Date
  error?: string
}

/**
 * Result of a verification code validation attempt
 */
export interface ValidateResult {
  success: boolean
  verified: boolean
  error?: string
}

/**
 * Options for verification code generation
 */
export interface VerificationOptions {
  obraId: string
  email?: string
  phone?: string
  method: 'email' | 'sms' | 'both'
  ipAddress?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Store only last 4 digits of phone number for GDPR compliance
 * @param phone - Full phone number
 * @returns Last 4 digits only
 */
function anonymizePhone(phone: string): string {
  // Remove spaces, dashes, and other formatting
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  // Return last 4 digits
  return cleaned.slice(-4)
}

/**
 * Generate a random 6-digit verification code
 * @returns 6-digit code as string
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send verification code via email using Mailgun
 * @param email - Recipient email address
 * @param code - 6-digit verification code
 * @param obraId - Associated work ID
 */
async function sendEmailVerification(
  email: string,
  code: string,
  obraId: string
): Promise<void> {
  const config = useRuntimeConfig()

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password
    }
  })

  try {
    await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Tu código de verificación - Prevenius',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">Código de Verificación</h2>
          <p>Has solicitado reportar un problema en una obra. Tu código de verificación es:</p>

          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981;">
              ${code}
            </span>
          </div>

          <p><strong>Este código expirará en 15 minutos.</strong></p>

          <p>Si no solicitaste este código, puedes ignorar este email de forma segura.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="font-size: 12px; color: #6b7280;">
            Este es un mensaje automático de Prevenius - Gestión de Planes de Seguridad.
          </p>
        </div>
      `
    })
    console.log(`Verification email sent to ${email}`)
  } catch (error: any) {
    console.error('SMTP verification error:', {
      message: error.message,
      code: error.code,
      command: error.command
    })
    throw new Error(`Failed to send verification email: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Send verification code via SMS using Twilio
 * @param phone - Recipient phone number (full international format)
 * @param code - 6-digit verification code
 */
async function sendSmsVerification(phone: string, code: string): Promise<void> {
  const config = useRuntimeConfig()

  // Dynamic import of Twilio (only load when needed)
  const twilio = require('twilio')
  const client = twilio(config.twilioSid, config.twilioToken)

  const message = `Tu código de verificación Prevenius es: ${code}. Expira en 15 minutos.`

  try {
    await client.messages.create({
      body: message,
      from: config.twilioWhatsAppFrom, // Using WhatsApp number as SMS sender
      to: phone
    })
    console.log(`Verification SMS sent to ${phone}`)
  } catch (error: any) {
    console.error('Twilio verification error:', {
      message: error.message,
      code: error.code,
      status: error.status
    })
    throw new Error(`Failed to send verification SMS: ${error.message || 'Unknown error'}`)
  }
}

// ============================================================================
// Verification Service
// ============================================================================

/**
 * Generate and send a verification code
 * @param options - Verification options
 * @returns Verification result with code and expiration
 */
export async function generateVerificationCode(
  options: VerificationOptions
): Promise<VerificationResult> {
  const { obraId, email, phone, method, ipAddress } = options

  // Ensure database connection
  await connectDB()

  // Validate at least one contact method is provided
  if (!email && !phone) {
    return {
      success: false,
      error: 'Debe proporcionar email o teléfono'
    }
  }

  // Generate 6-digit code
  const code = generateCode()

  // Calculate expiration (15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  try {
    // Create verification code document
    const verificationData: Partial<IVerificationCode> = {
      code,
      method,
      obraId,
      expiresAt,
      ipAddress
    }

    // Store email (full) and phone (partial for GDPR)
    if (email) {
      verificationData.email = email.toLowerCase()
    }

    if (phone) {
      // Store only last 4 digits for GDPR compliance
      verificationData.phone = anonymizePhone(phone)
    }

    // Dynamic import to ensure proper connection handling
    const { VerificationCode } = await import('../models/VerificationCode')
    await VerificationCode.create(verificationData)

    // Send verification based on method
    if (method === 'email' && email) {
      await sendEmailVerification(email, code, obraId)
    } else if (method === 'sms' && phone) {
      await sendSmsVerification(phone, code)
    } else if (method === 'both') {
      // Send both if both method selected
      if (email) {
        await sendEmailVerification(email, code, obraId)
      }
      if (phone) {
        await sendSmsVerification(phone, code)
      }
    }

    return {
      success: true,
      code,
      expiresAt
    }
  } catch (error: any) {
    console.error('Verification code generation error:', error)
    return {
      success: false,
      error: error.message || 'Error al generar código de verificación'
    }
  }
}

/**
 * Validate a verification code
 * @param code - 6-digit verification code
 * @param obraId - Associated work ID
 * @returns Validation result
 */
export async function validateVerificationCode(
  code: string,
  obraId: string
): Promise<ValidateResult> {
  // Ensure database connection
  await connectDB()

  try {
    // Dynamic import to ensure proper connection handling
    const { VerificationCode } = await import('../models/VerificationCode')

    // Find unverified code for this obra
    const verification = await VerificationCode.findOne({
      code,
      obraId,
      verified: false
    })

    if (!verification) {
      return {
        success: false,
        verified: false,
        error: 'Código de verificación inválido o expirado'
      }
    }

    // Check if code has expired
    if (verification.expiresAt < new Date()) {
      return {
        success: false,
        verified: false,
        error: 'El código ha expirado. Por favor, solicita un nuevo código.'
      }
    }

    // Mark code as verified
    verification.verified = true
    await verification.save()

    return {
      success: true,
      verified: true
    }
  } catch (error: any) {
    console.error('Verification code validation error:', error)
    return {
      success: false,
      verified: false,
      error: error.message || 'Error al validar código'
    }
  }
}

/**
 * Check if a code has already been used (verified)
 * @param code - 6-digit verification code
 * @param obraId - Associated work ID
 * @returns true if code was already used
 */
export async function isCodeUsed(
  code: string,
  obraId: string
): Promise<boolean> {
  // Dynamic import to ensure proper connection handling
  const { VerificationCode } = await import('../models/VerificationCode')

  const verification = await VerificationCode.findOne({
    code,
    obraId
  })

  return verification?.verified === true
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  generateVerificationCode,
  validateVerificationCode,
  isCodeUsed
}
