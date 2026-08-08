import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTimeGatingRuntimeMock = vi.fn()
const getPaymentSettingsMock = vi.fn()
const checkAvailabilityMock = vi.fn()
const reserveItemsMock = vi.fn()
const releaseItemsMock = vi.fn()
const getShippingCostsRuntimeMock = vi.fn()
const getShippingCostByMethodMock = vi.fn()
const getStripeSecretKeyMock = vi.fn()
const stripeCheckoutSessionCreateMock = vi.fn()
const productFindManyMock = vi.fn()
const orderCreateMock = vi.fn()
const orderFindUniqueMock = vi.fn()
const orderUpdateMock = vi.fn()
const userUpsertMock = vi.fn()
const pickupPointFindUniqueMock = vi.fn()
const expirePendingOrdersMock = vi.fn()

const txMock = {
  user: { upsert: userUpsertMock },
  pickupPoint: { findUnique: pickupPointFindUniqueMock },
  order: {
    create: orderCreateMock,
    findUnique: orderFindUniqueMock,
    update: orderUpdateMock,
  },
}

vi.mock('@/lib/db', () => ({
  prisma: {
    product: { findMany: productFindManyMock },
    order: { update: orderUpdateMock },
    $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock)),
  },
}))

vi.mock('@/lib/stock-manager', () => ({
  stockManager: {
    checkAvailability: checkAvailabilityMock,
    reserveItems: reserveItemsMock,
    releaseItems: releaseItemsMock,
  },
}))

vi.mock('@/lib/time-gating', () => ({
  getTimeGatingRuntime: getTimeGatingRuntimeMock,
}))

vi.mock('@/lib/shipping-costs', () => ({
  getShippingCostsRuntime: getShippingCostsRuntimeMock,
  getShippingCostByMethod: getShippingCostByMethodMock,
}))

vi.mock('@/lib/payments', () => ({
  PaymentProvider: {
    STRIPE: 'STRIPE',
    MERCADO_PAGO: 'MERCADO_PAGO',
  },
  getPaymentSettings: getPaymentSettingsMock,
  getStripeSecretKey: getStripeSecretKeyMock,
  getMercadoPagoAccessToken: vi.fn(),
  getSiteUrl: vi.fn(() => 'http://localhost:3000'),
}))

vi.mock('@/lib/mercadopago', () => ({
  createMercadoPagoPreference: vi.fn(),
}))

vi.mock('@/lib/order-expiry', () => ({
  expirePendingOrders: expirePendingOrdersMock,
}))

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: stripeCheckoutSessionCreateMock,
        },
      },
    })),
  }
})

const routeModulePromise = import('@/app/api/checkout/route')

function buildCheckoutBody(overrides: Record<string, unknown> = {}) {
  return {
    customerEmail: 'test@example.com',
    customerName: 'Juan Pérez',
    customerPhone: '+54 11 1234 5678',
    deliveryMethod: 'PICKUP_POINT',
    pickupLocationId: 'loc_1',
    items: [{ productId: 'prod_1', quantity: 1, sliced: true }],
    ...overrides,
  }
}

describe('POST /api/checkout — integración', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crea un pedido exitoso y retorna checkoutUrl de Stripe', async () => {
    getTimeGatingRuntimeMock.mockResolvedValue({
      enabled: true,
      service: {
        getTimeUntilOpening: () => ({ isOpen: true, nextOpening: null, remainingMs: null }),
        getCurrentWeekId: () => '2026-W32',
      },
    })
    getPaymentSettingsMock.mockResolvedValue({
      enabledProviders: ['STRIPE'],
      defaultProvider: 'STRIPE',
    })
    checkAvailabilityMock.mockResolvedValue({ available: true, currentStock: 10 })
    productFindManyMock.mockResolvedValue([{ id: 'prod_1', name: 'Pan de campo', price: 5000 }])
    getShippingCostsRuntimeMock.mockResolvedValue({})
    getShippingCostByMethodMock.mockReturnValue(0)
    userUpsertMock.mockResolvedValue({ id: 'user_1' })
    reserveItemsMock.mockResolvedValue({ success: true })

    const order = {
      id: 'order_1',
      orderNumber: 'TBK-2026-ABC123',
      items: [{ productId: 'prod_1', productName: 'Pan de campo', quantity: 1, unitPrice: 5000, sliced: true }],
    }
    orderCreateMock.mockResolvedValue(order)
    orderFindUniqueMock.mockResolvedValue(order)

    getStripeSecretKeyMock.mockResolvedValue('sk_test_key')
    stripeCheckoutSessionCreateMock.mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      payment_intent: 'pi_test_123',
    })

    const { POST } = await routeModulePromise
    const response = await POST(
      new NextRequest('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify(buildCheckoutBody()),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.orderId).toBe('order_1')
    expect(body.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_123')
    expect(body.paymentProvider).toBe('STRIPE')
  })

  it('retorna 400 cuando no hay stock', async () => {
    getTimeGatingRuntimeMock.mockResolvedValue({
      enabled: true,
      service: {
        getTimeUntilOpening: () => ({ isOpen: true, nextOpening: null, remainingMs: null }),
        getCurrentWeekId: () => '2026-W32',
      },
    })
    getPaymentSettingsMock.mockResolvedValue({
      enabledProviders: ['STRIPE'],
      defaultProvider: 'STRIPE',
    })
    checkAvailabilityMock.mockResolvedValue({ available: false, currentStock: 0 })

    const { POST } = await routeModulePromise
    const response = await POST(
      new NextRequest('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify(buildCheckoutBody()),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('stock')
  })

  it('retorna 400 con errores Zod para datos inválidos', async () => {
    getTimeGatingRuntimeMock.mockResolvedValue({
      enabled: true,
      service: {
        getTimeUntilOpening: () => ({ isOpen: true, nextOpening: null, remainingMs: null }),
        getCurrentWeekId: () => '2026-W32',
      },
    })

    const { POST } = await routeModulePromise
    const response = await POST(
      new NextRequest('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          customerEmail: 'invalid',
          customerName: '',
          customerPhone: '123',
          deliveryMethod: 'INVALID',
          items: [],
        }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Datos inválidos')
    expect(body.details).toBeDefined()
    expect(typeof body.details).toBe('string')
    expect(() => JSON.parse(body.details)).not.toThrow()
    expect(JSON.parse(body.details)).toBeInstanceOf(Array)
  })

  it('retorna 403 cuando el time-gating está cerrado', async () => {
    getTimeGatingRuntimeMock.mockResolvedValue({
      enabled: true,
      service: {
        getTimeUntilOpening: () => ({ isOpen: false, nextOpening: null, remainingMs: 60_000 }),
      },
    })

    const { POST } = await routeModulePromise
    const response = await POST(
      new NextRequest('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify(buildCheckoutBody()),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error).toBe('El sitio está cerrado para pedidos')
  })
})
