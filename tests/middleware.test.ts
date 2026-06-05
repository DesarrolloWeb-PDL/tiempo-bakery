import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const hasAdminSessionMock = vi.fn()
const isAdminAuthConfiguredMock = vi.fn()
const getAdminAuthConfigErrorMock = vi.fn()

vi.mock('@/lib/admin-auth', () => ({
  hasAdminSession: hasAdminSessionMock,
  isAdminAuthConfigured: isAdminAuthConfiguredMock,
  getAdminAuthConfigError: getAdminAuthConfigErrorMock,
}))

describe('middleware', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    isAdminAuthConfiguredMock.mockReturnValue(true)
    hasAdminSessionMock.mockResolvedValue(true)
    getAdminAuthConfigErrorMock.mockReturnValue('faltan credenciales')
  })

  it('agrega headers de seguridad en requests admin autorizados', async () => {
    const { middleware } = await import('@/middleware')
    const request = new NextRequest('https://localhost/admin/productos', {
      headers: { 'x-forwarded-proto': 'https' },
    })

    const response = await middleware(request)

    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=63072000')
    expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'self' 'unsafe-inline'")
    expect(response.headers.get('Content-Security-Policy')).toContain("style-src 'self' 'unsafe-inline'")
    expect(response.headers.get('Content-Security-Policy')).toContain("img-src 'self' data: blob: https:")
  })

  it('limita intentos repetidos sobre login admin', async () => {
    const { middleware } = await import('@/middleware')

    let response = null

    for (let attempt = 0; attempt < 6; attempt += 1) {
      response = await middleware(
        new NextRequest('http://localhost/api/admin/login', {
          method: 'POST',
          headers: { 'x-forwarded-for': '203.0.113.10' },
        })
      )
    }

    expect(response?.status).toBe(429)
    expect(response?.headers.get('Retry-After')).toBeTruthy()
    expect(response?.headers.get('X-RateLimit-Limit')).toBe('5')
  })

  it('permite endpoints públicos de logo sin sesión admin', async () => {
    hasAdminSessionMock.mockResolvedValue(false)

    const { middleware } = await import('@/middleware')
    const response = await middleware(new NextRequest('https://localhost/api/admin/uploads/logo?file=test.png'))

    expect(response.status).toBe(200)
  })
})