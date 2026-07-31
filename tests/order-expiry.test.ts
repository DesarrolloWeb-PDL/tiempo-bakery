import { beforeEach, describe, expect, it, vi } from 'vitest'

const orderFindManyMock = vi.fn()
const orderFindUniqueMock = vi.fn()
const orderUpdateMock = vi.fn()
const releaseItemsMock = vi.fn()

const txMock = {
  order: {
    findUnique: orderFindUniqueMock,
    update: orderUpdateMock,
  },
}

const prismaMock = {
  order: {
    findMany: orderFindManyMock,
  },
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock)),
}

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/stock-manager', () => ({
  stockManager: {
    releaseItems: releaseItemsMock,
  },
}))

const { expirePendingOrders, PENDING_ORDER_TTL_MS } = await import('@/lib/order-expiry')

function pendingOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order_1',
    orderNumber: 'TBK-2026-0001',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    weekId: '2026-W19',
    deletedAt: null,
    items: [{ productId: 'prod_1', quantity: 2 }],
    ...overrides,
  }
}

describe('expirePendingOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    releaseItemsMock.mockReset().mockResolvedValue(true)
    orderFindUniqueMock.mockReset()
    orderUpdateMock.mockReset()
  })

  it('expira una orden stripe PENDING vieja liberando stock contra el weekId de la orden', async () => {
    orderFindManyMock.mockResolvedValue([{ id: 'order_1' }])
    orderFindUniqueMock.mockResolvedValue(pendingOrder())

    const result = await expirePendingOrders()

    expect(result).toEqual({ expired: 1 })
    expect(releaseItemsMock).toHaveBeenCalledWith(
      [{ productId: 'prod_1', quantity: 2 }],
      '2026-W19',
      txMock
    )
    expect(orderUpdateMock).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
        adminNotes: 'Pedido expirado automáticamente por falta de pago (2h)',
      },
    })
  })

  it('no expira órdenes con paymentMethod bank_transfer', async () => {
    orderFindManyMock.mockResolvedValue([])

    await expirePendingOrders()

    expect(orderFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          paymentMethod: { in: ['stripe', 'mercadopago'] },
        }),
      })
    )
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('no expira órdenes recientes (menos de 2h)', async () => {
    orderFindManyMock.mockResolvedValue([])

    await expirePendingOrders()

    const where = orderFindManyMock.mock.calls[0][0].where
    expect(where.createdAt.lt).toBeInstanceOf(Date)
    expect(where.createdAt.lt.getTime()).toBeGreaterThanOrEqual(
      Date.now() - PENDING_ORDER_TTL_MS - 1000
    )
    expect(where.createdAt.lt.getTime()).toBeLessThanOrEqual(
      Date.now() - PENDING_ORDER_TTL_MS + 1000
    )
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('no expira órdenes ya PAID ni ya CANCELLED (filtro en la query)', async () => {
    orderFindManyMock.mockResolvedValue([])

    await expirePendingOrders()

    expect(orderFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PENDING',
          paymentStatus: 'PENDING',
          deletedAt: null,
        }),
      })
    )
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('no cancela una orden que ya cambió de estado antes de la transacción', async () => {
    orderFindManyMock.mockResolvedValue([{ id: 'order_1' }])
    orderFindUniqueMock.mockResolvedValue(pendingOrder({ status: 'PAID', paymentStatus: 'PAID' }))

    const result = await expirePendingOrders()

    expect(result).toEqual({ expired: 0 })
    expect(releaseItemsMock).not.toHaveBeenCalled()
    expect(orderUpdateMock).not.toHaveBeenCalled()
  })

  it('expira múltiples órdenes y retorna el contador correcto', async () => {
    orderFindManyMock.mockResolvedValue([{ id: 'order_1' }, { id: 'order_2' }])
    orderFindUniqueMock
      .mockResolvedValueOnce(pendingOrder())
      .mockResolvedValueOnce(pendingOrder({ id: 'order_2', orderNumber: 'TBK-2026-0002' }))

    const result = await expirePendingOrders()

    expect(result).toEqual({ expired: 2 })
    expect(releaseItemsMock).toHaveBeenCalledTimes(2)
    expect(orderUpdateMock).toHaveBeenCalledTimes(2)
  })

  it('lanza error para hacer rollback si no se pudo liberar el stock', async () => {
    orderFindManyMock.mockResolvedValue([{ id: 'order_1' }])
    orderFindUniqueMock.mockResolvedValue(pendingOrder())
    releaseItemsMock.mockResolvedValue(false)

    await expect(expirePendingOrders()).rejects.toThrow(
      'No se pudo liberar la reserva del pedido TBK-2026-0001'
    )
    expect(orderUpdateMock).not.toHaveBeenCalled()
  })
})
