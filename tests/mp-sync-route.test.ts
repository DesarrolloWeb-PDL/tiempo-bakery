import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const syncOrderFromMercadoPagoMock = vi.fn()
const orderFindUniqueMock = vi.fn()

const prismaMock = {
  order: {
    findUnique: orderFindUniqueMock,
  },
}

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/mp-payment-sync', () => ({
  syncOrderFromMercadoPago: syncOrderFromMercadoPagoMock,
}))

const routeModulePromise = import('@/app/api/pedidos/[id]/mp-sync/route')

function orderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order_mp_1',
    orderNumber: 'TBK-2026-0010',
    paymentStatus: 'PENDING',
    status: 'PENDING',
    paidAt: null,
    mercadopagoPaymentId: null,
    customerEmail: 'ada@example.com',
    ...overrides,
  }
}

describe('pedidos mp-sync route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    syncOrderFromMercadoPagoMock.mockReset()
    orderFindUniqueMock.mockReset()
  })

  it('devuelve 404 si el pedido no existe', async () => {
    orderFindUniqueMock.mockResolvedValue(null)

    const { GET } = await routeModulePromise
    const response = await GET(
      new NextRequest('http://localhost/api/pedidos/orden_inexistente/mp-sync') as never,
      { params: { id: 'orden_inexistente' } }
    )

    expect(response.status).toBe(404)
    expect(syncOrderFromMercadoPagoMock).not.toHaveBeenCalled()
  })

  it('devuelve 403 si el email no coincide con el del pedido', async () => {
    orderFindUniqueMock.mockResolvedValue(orderRecord())

    const { GET } = await routeModulePromise
    const response = await GET(
      new NextRequest('http://localhost/api/pedidos/order_mp_1/mp-sync?email=otro@example.com') as never,
      { params: { id: 'order_mp_1' } }
    )

    expect(response.status).toBe(403)
    expect(syncOrderFromMercadoPagoMock).not.toHaveBeenCalled()
  })

  it('retorna el estado sin llamar a MP si el pedido ya está PAID', async () => {
    const paidAt = new Date('2026-06-01T10:00:00Z')
    orderFindUniqueMock.mockResolvedValue(orderRecord({
      paymentStatus: 'PAID',
      status: 'PAID',
      paidAt,
      mercadopagoPaymentId: '999001',
    }))

    const { GET } = await routeModulePromise
    const response = await GET(
      new NextRequest('http://localhost/api/pedidos/order_mp_1/mp-sync?email=ada@example.com') as never,
      { params: { id: 'order_mp_1' } }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(syncOrderFromMercadoPagoMock).not.toHaveBeenCalled()
    expect(body).toEqual({
      paymentStatus: 'PAID',
      status: 'PAID',
      paidAt: paidAt.toISOString(),
      mercadopagoPaymentId: '999001',
    })
  })

  it('sincroniza con MP y retorna el estado actualizado si el pedido no está PAID', async () => {
    orderFindUniqueMock
      .mockResolvedValueOnce(orderRecord())
      .mockResolvedValueOnce(orderRecord({
        paymentStatus: 'PAID',
        status: 'PAID',
        paidAt: new Date('2026-06-01T10:05:00Z'),
        mercadopagoPaymentId: '999002',
      }))
    syncOrderFromMercadoPagoMock.mockResolvedValue('paid')

    const { GET } = await routeModulePromise
    const response = await GET(
      new NextRequest('http://localhost/api/pedidos/order_mp_1/mp-sync?email=ada@example.com') as never,
      { params: { id: 'order_mp_1' } }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(syncOrderFromMercadoPagoMock).toHaveBeenCalledWith('order_mp_1')
    expect(body.paymentStatus).toBe('PAID')
    expect(body.status).toBe('PAID')
    expect(body.mercadopagoPaymentId).toBe('999002')
  })

  it('devuelve 500 si la sincronización falla', async () => {
    orderFindUniqueMock.mockResolvedValue(orderRecord())
    syncOrderFromMercadoPagoMock.mockRejectedValue(new Error('MP down'))

    const { GET } = await routeModulePromise
    const response = await GET(
      new NextRequest('http://localhost/api/pedidos/order_mp_1/mp-sync?email=ada@example.com') as never,
      { params: { id: 'order_mp_1' } }
    )

    expect(response.status).toBe(500)
  })
})
