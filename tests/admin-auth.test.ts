import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('admin auth session', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('ADMIN_PASSWORD', 'super-secreta')
    vi.stubEnv('JWT_SECRET', 'jwt-secret-test')
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('crea una sesión válida verificable por cookie', async () => {
    const { ADMIN_COOKIE, createAdminSessionToken, hasAdminSession } = await import('@/lib/admin-auth')

    const token = await createAdminSessionToken()

    expect(token).toBeTruthy()
    await expect(
      hasAdminSession({
        get(name: string) {
          if (name !== ADMIN_COOKIE || !token) return undefined
          return { value: token }
        },
      })
    ).resolves.toBe(true)
  })

  it('invalida la sesión si cambia la contraseña del admin', async () => {
    const { ADMIN_COOKIE, createAdminSessionToken, hasAdminSession } = await import('@/lib/admin-auth')
    const token = await createAdminSessionToken()

    process.env.ADMIN_PASSWORD = 'otra-clave'

    await expect(
      hasAdminSession({
        get(name: string) {
          if (name !== ADMIN_COOKIE || !token) return undefined
          return { value: token }
        },
      })
    ).resolves.toBe(false)
  })

  it('rechaza cookies manipuladas', async () => {
    const { ADMIN_COOKIE, createAdminSessionToken, hasAdminSession } = await import('@/lib/admin-auth')
    const token = await createAdminSessionToken()
    const tamperedToken = token ? `${token}manipulado` : ''

    await expect(
      hasAdminSession({
        get(name: string) {
          if (name !== ADMIN_COOKIE) return undefined
          return { value: tamperedToken }
        },
      })
    ).resolves.toBe(false)
  })
})