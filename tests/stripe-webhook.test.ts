import { beforeEach, describe, expect, it, vi } from 'vitest'

const constructEventMock = vi.fn()
const headersMock = vi.fn(async () => ({
  get(name: string) {
    return name === 'stripe-signature' ? 'firma-valida' : null
  },
}))

const confirmItemsMock = vi.fn()
const releaseItemsMock = vi.fn()
const findUniqueMock = vi.fn()
const findFirstMock = vi.fn()
const updateMock = vi.fn()
const stripeInstance = {
  webhooks: {
    constructEvent: constructEventMock,
  },
}

const prismaMock = {
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock)),
}

const txMock = {
  order: {
    findUnique: findUniqueMock,
    findFirst: findFirstMock,
    update: updateMock,
  },
}

vi.mock('next/headers', () => ({
  headers: headersMock,
}))

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/stock-manager', () => ({
  stockManager: {
    confirmItems: confirmItemsMock,
    releaseItems: releaseItemsMock,
  },
}))

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => stripeInstance),
}))

const routeModulePromise = import('@/app/api/webhooks/stripe/route')

describe('stripe webhook route', () => {
  beforeEach(() => {
    constructEventMock.mockReset()
    headersMock.mockClear()
    confirmItemsMock.mockReset()
    releaseItemsMock.mockReset()
    findUniqueMock.mockReset()
    findFirstMock.mockReset()
    updateMock.mockReset()
    prismaMock.$transaction.mockClear()
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  })

  it('no vuelve a confirmar stock si el pedido ya está pago', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'order_1',
      orderNumber: 'TBK-2026-0001',
      paymentStatus: 'PAID',
      status: 'PAID',
      weekId: '2026-W19',
      stripePaymentId: 'pi_1',
      items: [{ productId: 'prod_1', quantity: 2 }],
    })

    constructEventMock.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { orderId: 'order_1' },
          payment_intent: 'pi_1',
        },
      },
    })

    const { POST } = await routeModulePromise
    const response = await POST(new Request('http://localhost/api/webhooks/stripe', { method: 'POST', body: '{}' }) as never)

    expect(response.status).toBe(200)
    expect(confirmItemsMock).not.toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('cancela y libera stock cuando falla el payment intent correlacionado por metadata', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'order_2',
      orderNumber: 'TBK-2026-0002',
      paymentStatus: 'PENDING',
      status: 'PENDING',
      weekId: '2026-W19',
      items: [{ productId: 'prod_2', quantity: 1 }],
    })
    releaseItemsMock.mockResolvedValue(true)
    updateMock.mockResolvedValue({ orderNumber: 'TBK-2026-0002' })

    constructEventMock.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_fallido',
          metadata: { orderId: 'order_2' },
        },
      },
    })

    const { POST } = await routeModulePromise
    const response = await POST(new Request('http://localhost/api/webhooks/stripe', { method: 'POST', body: '{}' }) as never)

    expect(response.status).toBe(200)
    expect(releaseItemsMock).toHaveBeenCalledWith([{ productId: 'prod_2', quantity: 1 }], '2026-W19', txMock)
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'order_2' },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
        paymentMethod: 'stripe',
        stripePaymentId: 'pi_fallido',
      },
    })
  })
})