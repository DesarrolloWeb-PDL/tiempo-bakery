import { beforeEach, describe, expect, it, vi } from 'vitest'

const searchMercadoPagoMock = vi.fn()
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
  searchMercadoPagoPaymentByExternalReference: searchMercadoPagoMock,
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

const { syncOrderFromMercadoPago } = await import('@/lib/mp-payment-sync')

function pendingOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order_mp_1',
    orderNumber: 'TBK-2026-0010',
    paymentStatus: 'PENDING',
    status: 'PENDING',
    paymentMethod: null,
    mercadopagoPaymentId: null,
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
    ...overrides,
  }
}

describe('syncOrderFromMercadoPago', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchMercadoPagoMock.mockReset()
    confirmItemsMock.mockReset().mockResolvedValue(true)
    releaseItemsMock.mockReset().mockResolvedValue(true)
    sendOrderPaidEmailsMock.mockReset().mockResolvedValue({ skipped: false, customerSent: true, adminSent: true })
    findUniqueMock.mockReset()
    updateMock.mockReset()
    prismaMock.$transaction.mockClear()
  })

  it('marca la orden como PAID cuando Mercado Pago aprueba el pago, confirma stock y envía emails', async () => {
    searchMercadoPagoMock.mockResolvedValue({
      id: '999001',
      status: 'approved',
      external_reference: 'order_mp_1',
    })
    findUniqueMock
      .mockResolvedValueOnce(pendingOrder())
      .mockResolvedValueOnce(pendingOrder())
    updateMock.mockResolvedValue({
      paymentStatus: 'PAID',
      status: 'PAID',
      paymentMethod: 'mercadopago',
      mercadopagoPaymentId: '999001',
      paidAt: new Date('2026-06-01T10:00:00Z'),
    })

    const result = await syncOrderFromMercadoPago('order_mp_1')

    expect(result).toBe('paid')
    expect(searchMercadoPagoMock).toHaveBeenCalledWith('order_mp_1')
    expect(confirmItemsMock).toHaveBeenCalledWith(
      [{ productId: 'prod_1', productName: 'Pan de campo', quantity: 2, unitPrice: 6000, subtotal: 12000, sliced: true }],
      '2026-W22',
      txMock
    )
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'order_mp_1' },
      data: {
        paymentStatus: 'PAID',
        status: 'PAID',
        paymentMethod: 'mercadopago',
        mercadopagoPaymentId: '999001',
        paidAt: expect.any(Date),
      },
    })
    expect(sendOrderPaidEmailsMock).toHaveBeenCalledWith(expect.objectContaining({
      orderNumber: 'TBK-2026-0010',
      paymentStatus: 'PAID',
      mercadopagoPaymentId: '999001',
    }))
  })

  it('retorna already-paid sin tocar stock ni emails si la orden ya está PAID', async () => {
    searchMercadoPagoMock.mockResolvedValue({
      id: '999001',
      status: 'approved',
      external_reference: 'order_mp_1',
    })
    findUniqueMock.mockResolvedValue(pendingOrder({ paymentStatus: 'PAID', status: 'PAID' }))

    const result = await syncOrderFromMercadoPago('order_mp_1')

    expect(result).toBe('already-paid')
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
    expect(confirmItemsMock).not.toHaveBeenCalled()
    expect(sendOrderPaidEmailsMock).not.toHaveBeenCalled()
  })

  it('retorna no-payment cuando Mercado Pago no tiene pagos para la referencia', async () => {
    searchMercadoPagoMock.mockResolvedValue(null)

    const result = await syncOrderFromMercadoPago('order_mp_1')

    expect(result).toBe('no-payment')
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('retorna failed y libera stock cuando Mercado Pago rechaza el pago', async () => {
    searchMercadoPagoMock.mockResolvedValue({
      id: '999002',
      status: 'rejected',
      external_reference: 'order_mp_1',
    })
    findUniqueMock
      .mockResolvedValueOnce(pendingOrder())
      .mockResolvedValueOnce(pendingOrder())
    updateMock.mockResolvedValue({})

    const result = await syncOrderFromMercadoPago('order_mp_1')

    expect(result).toBe('failed')
    expect(releaseItemsMock).toHaveBeenCalledWith(
      [{ productId: 'prod_1', productName: 'Pan de campo', quantity: 2, unitPrice: 6000, subtotal: 12000, sliced: true }],
      '2026-W22',
      txMock
    )
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'order_mp_1' },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
        paymentMethod: 'mercadopago',
        mercadopagoPaymentId: '999002',
      },
    })
  })

  it('elige el último pago aprobado si hay varios resultados', async () => {
    searchMercadoPagoMock.mockResolvedValue({
      id: '999003',
      status: 'approved',
      external_reference: 'order_mp_1',
    })
    findUniqueMock
      .mockResolvedValueOnce(pendingOrder())
      .mockResolvedValueOnce(pendingOrder())
    updateMock.mockResolvedValue({
      paymentStatus: 'PAID',
      status: 'PAID',
      paymentMethod: 'mercadopago',
      mercadopagoPaymentId: '999003',
      paidAt: new Date(),
    })

    const result = await syncOrderFromMercadoPago('order_mp_1')

    expect(result).toBe('paid')
    expect(searchMercadoPagoMock).toHaveBeenCalledWith('order_mp_1')
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ mercadopagoPaymentId: '999003' }),
    }))
  })
})
