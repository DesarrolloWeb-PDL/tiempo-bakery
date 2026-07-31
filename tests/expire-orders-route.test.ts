import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const expirePendingOrdersMock = vi.fn()

vi.mock('@/lib/order-expiry', () => ({
  expirePendingOrders: expirePendingOrdersMock,
}))

const routeModulePromise = import('@/app/api/cron/expire-orders/route')

describe('expire-orders cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.CRON_SECRET
  })

  it('devuelve 401 si CRON_SECRET no está configurado', async () => {
    const { POST } = await routeModulePromise
    const response = await POST(new NextRequest('http://localhost/api/cron/expire-orders', { method: 'POST' }))

    expect(response.status).toBe(401)
    expect(expirePendingOrdersMock).not.toHaveBeenCalled()
  })

  it('devuelve 401 con header Authorization incorrecto', async () => {
    process.env.CRON_SECRET = 'secreto'
    const { POST } = await routeModulePromise
    const response = await POST(new NextRequest('http://localhost/api/cron/expire-orders', {
      method: 'POST',
      headers: { Authorization: 'Bearer incorrecto' },
    }))

    expect(response.status).toBe(401)
    expect(expirePendingOrdersMock).not.toHaveBeenCalled()
  })

  it('autoriza con header Authorization correcto y expira pedidos', async () => {
    process.env.CRON_SECRET = 'secreto'
    expirePendingOrdersMock.mockResolvedValue({ expired: 3 })

    const { POST } = await routeModulePromise
    const response = await POST(new NextRequest('http://localhost/api/cron/expire-orders', {
      method: 'POST',
      headers: { Authorization: 'Bearer secreto' },
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true, expired: 3 })
  })

  it('autoriza con header x-cron-secret correcto', async () => {
    process.env.CRON_SECRET = 'secreto'
    expirePendingOrdersMock.mockResolvedValue({ expired: 0 })

    const { POST } = await routeModulePromise
    const response = await POST(new NextRequest('http://localhost/api/cron/expire-orders', {
      method: 'POST',
      headers: { 'x-cron-secret': 'secreto' },
    }))

    expect(response.status).toBe(200)
  })

  it('devuelve 500 si expirePendingOrders falla', async () => {
    process.env.CRON_SECRET = 'secreto'
    expirePendingOrdersMock.mockRejectedValue(new Error('DB down'))

    const { POST } = await routeModulePromise
    const response = await POST(new NextRequest('http://localhost/api/cron/expire-orders', {
      method: 'POST',
      headers: { 'x-cron-secret': 'secreto' },
    }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ ok: false })
  })
})
