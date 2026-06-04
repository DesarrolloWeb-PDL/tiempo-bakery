import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getMercadoPagoPaymentMock = vi.fn()
const confirmItemsMock = vi.fn()
const releaseItemsMock = vi.fn()
const sendOrderPaidEmailsMock = vi.fn()
const findUniqueMock = vi.fn()
const updateMock = vi.fn()

const txMock = {
  order: {
    findUnique: findUniqueMock,
    update: updateMock,
  },
}

const prismaMock = {
  order: {
    findUnique: findUniqueMock,
    update: updateMock,
  },
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock)),
}

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/mercadopago', () => ({
  getMercadoPagoPayment: getMercadoPagoPaymentMock,
}))

vi.mock('@/lib/stock-manager', () => ({
  stockManager: {
    confirmItems: confirmItemsMock,
    releaseItems: releaseItemsMock,
  },
}))

vi.mock('@/lib/order-email', () => ({
  sendOrderPaidEmails: sendOrderPaidEmailsMock,
}))

const routeModulePromise = import('@/app/api/webhooks/mercadopago/route')

describe('mercadopago webhook route', () => {
  beforeEach(() => {
    getMercadoPagoPaymentMock.mockReset()
    confirmItemsMock.mockReset()
    releaseItemsMock.mockReset()
    sendOrderPaidEmailsMock.mockReset()
    findUniqueMock.mockReset()
    updateMock.mockReset()
    prismaMock.$transaction.mockClear()
  })

  it('confirma stock y envía emails cuando Mercado Pago aprueba el pago', async () => {
    getMercadoPagoPaymentMock.mockResolvedValue({
      id: 12345,
      status: 'approved',
      external_reference: 'order_mp_1',
    })
    findUniqueMock
      .mockResolvedValueOnce({
        id: 'order_mp_1',
        orderNumber: 'TBK-2026-0010',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        weekId: '2026-W22',
        customerName: 'Ada Lovelace',
        customerEmail: 'ada@example.com',
        customerPhone: '+54 11 1234 5678',
        deliveryMethod: 'PICKUP_POINT',
        pickupLocation: 'Obrador central',
        pickupAddress: 'Calle 123',
        pickupSchedule: 'Viernes 16 a 20h',
        shippingAddress: null,
        shippingCity: null,
        shippingPostal: null,
        subtotal: 12000,
        shippingCost: 0,
        total: 12000,
        customerNotes: null,
        paidAt: null,
        items: [{ productId: 'prod_1', productName: 'Pan de campo', quantity: 2, unitPrice: 6000, subtotal: 12000, sliced: true }],
      })
      .mockResolvedValueOnce({
        id: 'order_mp_1',
        orderNumber: 'TBK-2026-0010',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        weekId: '2026-W22',
        customerName: 'Ada Lovelace',
        customerEmail: 'ada@example.com',
        customerPhone: '+54 11 1234 5678',
        deliveryMethod: 'PICKUP_POINT',
        pickupLocation: 'Obrador central',
        pickupAddress: 'Calle 123',
        pickupSchedule: 'Viernes 16 a 20h',
        shippingAddress: null,
        shippingCity: null,
        shippingPostal: null,
        subtotal: 12000,
        shippingCost: 0,
        total: 12000,
        customerNotes: null,
        paidAt: null,
        items: [{ productId: 'prod_1', productName: 'Pan de campo', quantity: 2, unitPrice: 6000, subtotal: 12000, sliced: true }],
      })
    confirmItemsMock.mockResolvedValue(true)
    updateMock.mockResolvedValue({
      paymentStatus: 'PAID',
      status: 'PAID',
      paymentMethod: 'mercadopago',
      mercadopagoPaymentId: '12345',
      paidAt: new Date('2026-06-01T10:00:00Z'),
    })
    sendOrderPaidEmailsMock.mockResolvedValue({ skipped: false, customerSent: true, adminSent: true })

    const { POST } = await routeModulePromise
    const response = await POST(new NextRequest('http://localhost/api/webhooks/mercadopago?topic=payment&id=12345', { method: 'POST' }) as never)

    expect(response.status).toBe(200)
    expect(confirmItemsMock).toHaveBeenCalledWith(
      [{ productId: 'prod_1', productName: 'Pan de campo', quantity: 2, unitPrice: 6000, subtotal: 12000, sliced: true }],
      '2026-W22',
      txMock
    )
    expect(sendOrderPaidEmailsMock).toHaveBeenCalledWith(expect.objectContaining({
      orderNumber: 'TBK-2026-0010',
      paymentStatus: 'PAID',
      mercadopagoPaymentId: '12345',
    }))
  })
})