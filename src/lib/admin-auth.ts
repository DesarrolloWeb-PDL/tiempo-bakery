export const ADMIN_COOKIE = 'tbk_admin_auth'

export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7

type CookieReader = {
  get(name: string): { value?: string } | undefined
}

type AdminSessionPayload = {
  role: 'admin'
  jti: string
  iat: number
  exp: number
  passwordFingerprint: string
}

const encoder = new TextEncoder()

function toBase64Url(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function getAdminSessionSecret(): string | null {
  const configuredSecret = process.env.JWT_SECRET?.trim()

  if (configuredSecret) {
    return configuredSecret
  }

  return null
}

async function importSigningKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

async function signValue(value: string, secret: string): Promise<string> {
  const key = await importSigningKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return toBase64Url(signature)
}

async function getPasswordFingerprint(password: string, secret: string): Promise<string> {
  return signValue(password, secret)
}

function generateJti(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function parseSessionPayload(token: string): AdminSessionPayload | null {
  try {
    const [payloadSegment] = token.split('.')

    if (!payloadSegment) {
      return null
    }

    const payloadJson = new TextDecoder().decode(fromBase64Url(payloadSegment))
    const payload = JSON.parse(payloadJson) as Partial<AdminSessionPayload>

    if (
      payload.role !== 'admin' ||
      typeof payload.jti !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number' ||
      typeof payload.passwordFingerprint !== 'string'
    ) {
      return null
    }

    return payload as AdminSessionPayload
  } catch {
    return null
  }
}

export function getAdminPassword(): string | null {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim()

  if (configuredPassword) {
    return configuredPassword
  }

  return null
}

export function isAdminAuthConfigured(): boolean {
  return getAdminPassword() !== null && getAdminSessionSecret() !== null
}

export async function createAdminSessionToken(): Promise<string | null> {
  const adminPassword = getAdminPassword()
  const sessionSecret = getAdminSessionSecret()

  if (!adminPassword || !sessionSecret) {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  const jti = generateJti()
  const payload: AdminSessionPayload = {
    role: 'admin',
    jti,
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE,
    passwordFingerprint: await getPasswordFingerprint(adminPassword, sessionSecret),
  }

  const payloadSegment = toBase64Url(encoder.encode(JSON.stringify(payload)))
  const signature = await signValue(payloadSegment, sessionSecret)

  return `${payloadSegment}.${signature}`
}

export async function persistAdminSession(jti: string): Promise<void> {
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE * 1000)
  const { prisma } = await import('@/lib/db')
  await prisma.adminSession.create({
    data: { jti, expiresAt },
  })
}

export async function revokeAdminSession(jti: string): Promise<void> {
  const { prisma } = await import('@/lib/db')
  await prisma.adminSession.updateMany({
    where: { jti, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllAdminSessions(): Promise<void> {
  const { prisma } = await import('@/lib/db')
  await prisma.adminSession.updateMany({
    where: { revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

async function cleanupExpiredSessions(): Promise<void> {
  const { prisma } = await import('@/lib/db')
  await prisma.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}

export function getAdminAuthConfigError(): string {
  if (!getAdminPassword()) {
    return 'ADMIN_PASSWORD no está configurada en el entorno'
  }

  if (!getAdminSessionSecret()) {
    return 'JWT_SECRET no está configurada en el entorno'
  }

  return 'La autenticación de administración no está configurada correctamente'
}

export async function hasAdminSession(cookies: CookieReader): Promise<boolean> {
  const adminPassword = getAdminPassword()
  const sessionSecret = getAdminSessionSecret()
  const token = cookies.get(ADMIN_COOKIE)?.value

  if (!adminPassword || !sessionSecret || !token) {
    return false
  }

  const [payloadSegment, signatureSegment] = token.split('.')

  if (!payloadSegment || !signatureSegment) {
    return false
  }

  const expectedSignature = await signValue(payloadSegment, sessionSecret)

  if (signatureSegment !== expectedSignature) {
    return false
  }

  const payload = parseSessionPayload(token)

  if (!payload) {
    return false
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return false
  }

  const expectedFingerprint = await getPasswordFingerprint(adminPassword, sessionSecret)
  if (payload.passwordFingerprint !== expectedFingerprint) {
    return false
  }

  try {
    const { prisma } = await import('@/lib/db')
    const session = await prisma.adminSession.findUnique({
      where: { jti: payload.jti },
      select: { revokedAt: true },
    })

    if (!session || session.revokedAt) {
      return false
    }
  } catch {
    return true
  }

  return true
}

export async function hasAdminSessionEdge(cookies: CookieReader): Promise<boolean> {
  const adminPassword = getAdminPassword()
  const sessionSecret = getAdminSessionSecret()
  const token = cookies.get(ADMIN_COOKIE)?.value

  if (!adminPassword || !sessionSecret || !token) {
    return false
  }

  const [payloadSegment, signatureSegment] = token.split('.')

  if (!payloadSegment || !signatureSegment) {
    return false
  }

  const expectedSignature = await signValue(payloadSegment, sessionSecret)

  if (signatureSegment !== expectedSignature) {
    return false
  }

  const payload = parseSessionPayload(token)

  if (!payload) {
    return false
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return false
  }

  const expectedFingerprint = await getPasswordFingerprint(adminPassword, sessionSecret)
  if (payload.passwordFingerprint !== expectedFingerprint) {
    return false
  }

  return true
}

export function extractJtiFromCookie(cookies: CookieReader): string | null {
  const token = cookies.get(ADMIN_COOKIE)?.value
  if (!token) return null
  const payload = parseSessionPayload(token)
  return payload?.jti ?? null
}