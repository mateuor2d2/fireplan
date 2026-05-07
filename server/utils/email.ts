import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.cima20.io',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user: process.env.SMTP_USER || 'invitacionesapps@cima20.io',
      pass: process.env.SMTP_PASSWORD || ''
    }
  })
}

function getFromAddress(): string {
  const fromName = process.env.SMTP_FROM_NAME || 'Prevenius'
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'invitacionesapps@cima20.io'
  return `"${fromName}" <${fromEmail}>`
}

export async function sendVerificationEmail(
  email: string,
  verificationLink: string
): Promise<void> {
  const transporter = createTransporter()
  const from = getFromAddress()

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Verifica tu email - Prevenius',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d946ef;">Verifica tu cuenta de Prevenius</h2>
          <p>Bienvenido a Prevenius. Haz clic en el boton para verificar tu email y activar tu cuenta:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #d946ef;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">
              Verificar Email
            </a>
          </p>
          <p>Si no creaste una cuenta en Prevenius, puedes ignorar este email.</p>
          <p>Este enlace expirara en 24 horas.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Este es un mensaje automatico de Prevenius - Gestion de Planes de Seguridad.
          </p>
        </div>
      `
    })
  } catch (error: any) {
    console.error('SMTP verification email error:', {
      message: error.message,
      code: error.code,
      command: error.command
    })
    throw new Error(`Failed to send verification email: ${error.message || 'Unknown error'}`)
  }
}

export async function sendInvitationEmail(
  email: string,
  obraName: string,
  inviteLink: string
): Promise<void> {
  const transporter = createTransporter()
  const from = getFromAddress()

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: `Has sido invitado a la obra "${obraName}" - Prevenius`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d946ef;">Invitacion a obra</h2>
          <p>Has sido invitado como <strong>colaborador</strong> a la obra <strong>${obraName}</strong> en Prevenius.</p>
          <p>Haz clic en el boton para crear tu cuenta y acceder:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #d946ef;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">
              Aceptar Invitacion
            </a>
          </p>
          <p>Este enlace expirara en 7 dias.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Este es un mensaje automatico de Prevenius - Gestion de Planes de Seguridad.
          </p>
        </div>
      `
    })
  } catch (error: any) {
    console.error('SMTP invitation email error:', {
      message: error.message,
      code: error.code,
      command: error.command
    })
    throw new Error(`Failed to send invitation email: ${error.message || 'Unknown error'}`)
  }
}

export async function sendResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  const transporter = createTransporter()
  const from = getFromAddress()

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Recuperar contrasena - Prevenius',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d946ef;">Recuperar tu contrasena</h2>
          <p>Has solicitado restablecer tu contrasena. Haz clic en el boton para establecer una nueva:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #d946ef;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">
              Restablecer Contrasena
            </a>
          </p>
          <p>Si no solicitaste esto, puedes ignorar este email.</p>
          <p>Este enlace expirara en 1 hora.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Este es un mensaje automatico de Prevenius - Gestion de Planes de Seguridad.
          </p>
        </div>
      `
    })
  } catch (error: any) {
    console.error('SMTP reset email error:', {
      message: error.message,
      code: error.code,
      command: error.command
    })
    throw new Error(`Failed to send reset email: ${error.message || 'Unknown error'}`)
  }
}

export async function sendPaymentFailureEmail(
  email: string,
  planName: string,
  invoiceUrl: string,
  retryCount: number
): Promise<void> {
  const transporter = createTransporter()
  const from = getFromAddress()

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Accion Requerida: Pago Fallido - Prevenius',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Pago Fallido para ${planName}</h2>
          <p>Hemos tenido un problema al procesar tu pago.</p>
          <p><strong>Detalles del problema:</strong> El pago no ha podido ser procesado.</p>
          <p>Por favor, actualiza tu metodo de pago para continuar con tu suscripcion.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${invoiceUrl}" style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #d946ef;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">
              Ver Factura y Actualizar Pago
            </a>
          </p>
          <p style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; border-left: 4px solid #ffa500;">
            <strong>Informacion Importante:</strong><br>
            Tu suscripcion se mantendra activa durante 7 dias mientras Stripe reintenta el pago automaticamente.<br>
            No perderas acceso al servicio durante este periodo.
          </p>
          <p style="font-size: 12px; color: #666;">
            Intentos de reintentos restantes: ${retryCount}<br>
            Si el problema persiste, contacta con soporte tecnico.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Este es un mensaje automatico de Prevenius - Gestion de Planes de Seguridad.
          </p>
        </div>
      `
    })
    console.log('Payment failure email sent successfully')
  } catch (error: any) {
    console.error('SMTP payment failure email error:', {
      message: error.message,
      code: error.code,
      command: error.command
    })
    throw new Error(`Failed to send payment failure email: ${error.message || 'Unknown error'}`)
  }
}
