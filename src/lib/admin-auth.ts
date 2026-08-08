export {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  getAdminPassword,
  isAdminAuthConfigured,
  getAdminAuthConfigError,
  extractJtiFromCookie,
  type CookieReader,
  type AdminSessionPayload,
} from '@/lib/admin-auth-core'

import {
  ADMIN_SESSION_MAX_AGE,
  getAdminPassword,
  getAdminSessionSecret,
  generateJti,
  getPasswordFingerprint,
  signValue,
  toBase64Url,
  validateAdminSession,
  parseSessionPayload,
  type AdminSessionPayload,
} from '@/lib/admin-auth-core'

const encoder = new TextEncoder()

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

const sessionCache = new Map<string, { valid: boolean; expiresAt: number }>()
const SESSION_CACHE_TTL = 30_000

export async function hasAdminSession(cookies: import('@/lib/admin-auth-core').CookieReader): Promise<boolean> {
  const valid = await validateAdminSession(cookies)
  if (!valid) return false

  const token = cookies.get('tbk_admin_auth')?.value
  if (!token) return false

  const payload = parseSessionPayload(token)
  if (!payload) return false

  const cacheKey = payload.jti
  const cached = sessionCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.valid
  }

  let result = true
  try {
    const { prisma } = await import('@/lib/db')
    const session = await prisma.adminSession.findUnique({
      where: { jti: payload.jti },
      select: { revokedAt: true },
    })

    if (!session || session.revokedAt) {
      result = false
    }
  } catch {
    result = true
  }

  sessionCache.set(cacheKey, { valid: result, expiresAt: Date.now() + SESSION_CACHE_TTL })
  return result
}

export { validateAdminSession as hasAdminSessionEdge }
