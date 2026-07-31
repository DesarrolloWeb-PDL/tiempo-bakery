import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTimeGatingRuntimeMock = vi.fn()
const getPaymentSettingsMock = vi.fn()
const checkAvailabilityMock = vi.fn()
const reserveItemsMock = vi.fn()
const releaseItemsMock = vi.fn()
const getShippingCostsRuntimeMock = vi.fn()
const getShippingCostByMethodMock = vi.fn()
const createMercadoPagoPreferenceMock = vi.fn()
const getMercadoPagoAccessTokenMock = vi.fn()
const productFindManyMock = vi.fn()
const orderUpdateMock = vi.fn()
const userUpsertMock = vi.fn()
const pickupPointFindUniqueMock = vi.fn()
const orderCreateMock = vi.fn()
const orderFindUniqueMock = vi.fn()

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

vi.mock('@/lib/mercadopago', () => ({
  createMercadoPagoPreference: createMercadoPagoPreferenceMock,
}))

vi.mock('@/lib/payments', () => ({
  PaymentProvider: {
    STRIPE: 'STRIPE',
    MERCADO_PAGO: 'MERCADO_PAGO',
  },
  getPaymentSettings: getPaymentSettingsMock,
  getMercadoPagoAccessToken: getMercadoPagoAccessTokenMock,
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

  it('hace rollback y devuelve 500 cuando falla la creación de la preferencia de Mercado Pago', async () => {
    getTimeGatingRuntimeMock.mockResolvedValue({
      enabled: true,
      service: {
        getTimeUntilOpening: () => ({ isOpen: true, nextOpening: null, remainingMs: null }),
        getCurrentWeekId: () => '2026-W23',
      },
    })
    getPaymentSettingsMock.mockResolvedValue({
      enabledProviders: ['MERCADO_PAGO'],
      defaultProvider: 'MERCADO_PAGO',
    })

    const order = {
      id: 'order_mp_1',
      orderNumber: 'TBK-2026-0099',
      weekId: '2026-W23',
      paymentStatus: 'PENDING',
      items: [{ productId: 'prod_1', productName: 'Pan de campo', quantity: 1, unitPrice: 5000, sliced: true }],
    }

    checkAvailabilityMock.mockResolvedValue({ available: true, currentStock: 10 })
    productFindManyMock.mockResolvedValue([{ id: 'prod_1', name: 'Pan de campo', price: 5000 }])
    getShippingCostsRuntimeMock.mockResolvedValue({})
    getShippingCostByMethodMock.mockReturnValue(0)
    userUpsertMock.mockResolvedValue({ id: 'user_1' })
    reserveItemsMock.mockResolvedValue({ success: true })
    orderCreateMock.mockResolvedValue(order)
    orderFindUniqueMock.mockResolvedValue(order)
    releaseItemsMock.mockResolvedValue(true)
    getMercadoPagoAccessTokenMock.mockResolvedValue('TEST-ACCESS-TOKEN')
    createMercadoPagoPreferenceMock.mockRejectedValue(new Error('MP API caída'))

    const { POST } = await routeModulePromise
    const response = await POST(new NextRequest('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        customerEmail: 'ada@example.com',
        customerName: 'Ada Lovelace',
        customerPhone: '+54 11 1234 5678',
        deliveryMethod: 'PICKUP_POINT',
        paymentProvider: 'MERCADO_PAGO',
        items: [{ productId: 'prod_1', quantity: 1, sliced: true }],
      }),
    }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'MP API caída' })
    expect(releaseItemsMock).toHaveBeenCalledWith(
      [{ productId: 'prod_1', productName: 'Pan de campo', quantity: 1, unitPrice: 5000, sliced: true }],
      '2026-W23',
      txMock
    )
    expect(orderUpdateMock).toHaveBeenCalledWith({
      where: { id: 'order_mp_1' },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
      },
    })
  })
})