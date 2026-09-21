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
const deliveryZoneFindUniqueMock = vi.fn()
const deliveryScheduleFindUniqueMock = vi.fn()
const orderCountMock = vi.fn()

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
    order: { update: orderUpdateMock, count: orderCountMock },
    deliveryZone: { findUnique: deliveryZoneFindUniqueMock },
    deliverySchedule: { findUnique: deliveryScheduleFindUniqueMock },
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

const getLocalDeliveryShippingCostMock = vi.fn()

vi.mock('@/lib/shipping-costs', () => ({
  getShippingCostsRuntime: getShippingCostsRuntimeMock,
  getShippingCostByMethod: getShippingCostByMethodMock,
  getLocalDeliveryShippingCost: getLocalDeliveryShippingCostMock,
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

function buildLocalDeliveryBody(overrides: Record<string, unknown> = {}) {
  return {
    customerEmail: 'test@example.com',
    customerName: 'Juan Pérez',
    customerPhone: '+54 11 1234 5678',
    deliveryMethod: 'LOCAL_DELIVERY',
    shippingAddress: 'Calle Falsa 123',
    shippingCity: 'Utrera',
    shippingPostal: '41710',
    zoneId: 'z1',
    scheduleId: 'slot-fri',
    deliveryDate: '2026-09-25T00:00:00.000Z',
    items: [{ productId: 'prod_1', quantity: 1, sliced: true }],
    ...overrides,
  }
}

function setupHappyPath({ shippingCost = 2500 }: { shippingCost?: number } = {}) {
  getLocalDeliveryShippingCostMock.mockResolvedValue(shippingCost)
  getTimeGatingRuntimeMock.mockResolvedValue({
    enabled: true,
    service: {
      getTimeUntilOpening: () => ({ isOpen: true, nextOpening: null, remainingMs: null }),
      getCurrentWeekId: () => '2026-W38',
    },
  })
  getPaymentSettingsMock.mockResolvedValue({
    enabledProviders: ['STRIPE'],
    defaultProvider: 'STRIPE',
  })
  checkAvailabilityMock.mockResolvedValue({ available: true, currentStock: 10 })
  productFindManyMock.mockResolvedValue([{ id: 'prod_1', name: 'Pan de campo', price: 5000 }])
  getShippingCostsRuntimeMock.mockResolvedValue({
    pickupPoint: 0,
    localDelivery: 3500,
    nationalCourier: 5950,
  })
  getShippingCostByMethodMock.mockReturnValue(shippingCost)
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
}

describe('POST /api/checkout — delivery zone and day validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores zone price in the order when a valid zone is selected', async () => {
    setupHappyPath({ shippingCost: 2500 })
    deliveryZoneFindUniqueMock.mockResolvedValue({
      id: 'z1',
      name: 'Centro',
      shippingCost: 2500,
      minOrderFree: null,
      isActive: true,
    })
    deliveryScheduleFindUniqueMock.mockResolvedValue({
      id: 'slot-fri',
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '14:00',
      maxOrders: 10,
      cutoffDay: null,
      cutoffTime: null,
      isActive: true,
    })
    orderCountMock.mockResolvedValue(3)

    const { POST } = await routeModulePromise
    const response = await POST(
      new NextRequest('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify(buildLocalDeliveryBody()),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(orderCreateMock).toHaveBeenCalled()
    const orderData = orderCreateMock.mock.calls[0][0].data
    expect(orderData.shippingCost).toBe(2500)
    expect(orderData.deliveryZoneId).toBe('z1')
    expect(orderData.deliveryScheduleId).toBe('slot-fri')
    expect(orderData.deliveryDate).toBeDefined()
  })

  it('returns 400 when the selected zone is invalid or inactive', async () => {
    setupHappyPath()
    deliveryZoneFindUniqueMock.mockResolvedValue(null)

    const { POST } = await routeModulePromise
    const response = await POST(
      new NextRequest('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify(buildLocalDeliveryBody()),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('zona')
  })

  it('returns 409 when the selected day is unavailable', async () => {
    setupHappyPath()
    deliveryZoneFindUniqueMock.mockResolvedValue({
      id: 'z1',
      name: 'Centro',
      shippingCost: 2500,
      minOrderFree: null,
      isActive: true,
    })
    deliveryScheduleFindUniqueMock.mockResolvedValue({
      id: 'slot-fri',
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '14:00',
      maxOrders: 5,
      cutoffDay: null,
      cutoffTime: null,
      isActive: true,
    })
    orderCountMock.mockResolvedValue(5)

    const { POST } = await routeModulePromise
    const response = await POST(
      new NextRequest('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify(buildLocalDeliveryBody()),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toContain('día')
  })

  it('falls back to flat-rate SiteConfig when no zone is selected', async () => {
    setupHappyPath({ shippingCost: 3500 })
    deliveryScheduleFindUniqueMock.mockResolvedValue({
      id: 'slot-fri',
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '14:00',
      maxOrders: 10,
      cutoffDay: null,
      cutoffTime: null,
      isActive: true,
    })
    orderCountMock.mockResolvedValue(3)

    const { POST } = await routeModulePromise
    const response = await POST(
      new NextRequest('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify(buildLocalDeliveryBody({ zoneId: undefined })),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    const orderData = orderCreateMock.mock.calls[0][0].data
    expect(orderData.shippingCost).toBe(3500)
    expect(orderData.deliveryZoneId).toBeNull()
  })
})
