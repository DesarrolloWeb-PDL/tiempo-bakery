import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTimeGatingRuntimeMock = vi.fn()
const getPaymentSettingsMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    product: { findMany: vi.fn() },
    order: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/stock-manager', () => ({
  stockManager: {
    checkAvailability: vi.fn(),
    reserveItems: vi.fn(),
    releaseItems: vi.fn(),
  },
}))

vi.mock('@/lib/time-gating', () => ({
  getTimeGatingRuntime: getTimeGatingRuntimeMock,
}))

vi.mock('@/lib/shipping-costs', () => ({
  getShippingCostsRuntime: vi.fn(),
  getShippingCostByMethod: vi.fn(),
}))

vi.mock('@/lib/mercadopago', () => ({
  createMercadoPagoPreference: vi.fn(),
}))

vi.mock('@/lib/payments', () => ({
  PaymentProvider: {
    STRIPE: 'STRIPE',
    MERCADO_PAGO: 'MERCADO_PAGO',
  },
  getPaymentSettings: getPaymentSettingsMock,
}))

vi.mock('stripe', () => ({
  default: vi.fn(),
}))

const routeModulePromise = import('@/app/api/checkout/route')

describe('checkout route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rechaza el checkout cuando el time-gating está cerrado', async () => {
    getTimeGatingRuntimeMock.mockResolvedValue({
      enabled: true,
      service: {
        getTimeUntilOpening: () => ({ isOpen: false, nextOpening: null, remainingMs: 60_000 }),
      },
    })

    const { POST } = await routeModulePromise
    const response = await POST(new NextRequest('http://localhost/api/checkout', { method: 'POST', body: '{}' }))
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body).toEqual({ error: 'El sitio está cerrado para pedidos' })
    expect(getPaymentSettingsMock).not.toHaveBeenCalled()
  })

  it('rechaza el checkout cuando no hay medios de pago habilitados', async () => {
    getTimeGatingRuntimeMock.mockResolvedValue({
      enabled: true,
      service: {
        getTimeUntilOpening: () => ({ isOpen: true, nextOpening: null, remainingMs: null }),
        getCurrentWeekId: () => '2026-W23',
      },
    })
    getPaymentSettingsMock.mockResolvedValue({
      enabledProviders: [],
      defaultProvider: 'STRIPE',
    })

    const { POST } = await routeModulePromise
    const response = await POST(new NextRequest('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        customerEmail: 'ada@example.com',
        customerName: 'Ada Lovelace',
        customerPhone: '+54 11 1234 5678',
        deliveryMethod: 'PICKUP_POINT',
        items: [{ productId: 'prod_1', quantity: 1, sliced: true }],
      }),
    }))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({ error: 'No hay medios de pago configurados en el servidor' })
  })
})