import { beforeEach, describe, expect, it, vi } from 'vitest'

const getCurrentWeekIdMock = vi.fn(() => '2026-W23')

const productFindUniqueMock = vi.fn()
const productFindManyMock = vi.fn()
const weeklyStockUpsertMock = vi.fn()
const weeklyStockFindUniqueMock = vi.fn()
const weeklyStockCreateMock = vi.fn()
const weeklyStockUpdateMock = vi.fn()
const queryRawMock = vi.fn()

vi.mock('@/lib/time-gating', () => ({
  timeGating: {
    getCurrentWeekId: getCurrentWeekIdMock,
  },
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    product: {
      findUnique: productFindUniqueMock,
      findMany: productFindManyMock,
    },
    weeklyStock: {
      upsert: weeklyStockUpsertMock,
      findUnique: weeklyStockFindUniqueMock,
      create: weeklyStockCreateMock,
      update: weeklyStockUpdateMock,
    },
    $queryRaw: queryRawMock,
  },
}))

const stockManagerModulePromise = import('@/lib/stock-manager')

describe('stock-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCurrentWeekIdMock.mockReturnValue('2026-W23')
  })

  it('retorna no disponible para producto inactivo o no publicado', async () => {
    productFindUniqueMock.mockResolvedValue({
      id: 'prod_1',
      stockType: 'WEEKLY',
      weeklyStock: 20,
      isActive: false,
      published: true,
    })

    const { stockManager } = await stockManagerModulePromise
    const result = await stockManager.checkAvailability('prod_1', 1)

    expect(result).toEqual({ available: false, currentStock: 0 })
    expect(weeklyStockUpsertMock).not.toHaveBeenCalled()
  })

  it('retorna disponibilidad ilimitada para productos UNLIMITED', async () => {
    productFindUniqueMock.mockResolvedValue({
      id: 'prod_2',
      stockType: 'UNLIMITED',
      weeklyStock: 0,
      isActive: true,
      published: true,
    })

    const { stockManager } = await stockManagerModulePromise
    const result = await stockManager.checkAvailability('prod_2', 999)

    expect(result.available).toBe(true)
    expect(result.currentStock).toBe(Number.MAX_SAFE_INTEGER)
    expect(weeklyStockUpsertMock).not.toHaveBeenCalled()
  })

  it('reserva items y reporta el primer producto que falla', async () => {
    const { stockManager } = await stockManagerModulePromise
    const reserveStockSpy = vi.spyOn(stockManager, 'reserveStock')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    const result = await stockManager.reserveItems([
      { productId: 'prod_a', quantity: 1 },
      { productId: 'prod_b', quantity: 2 },
      { productId: 'prod_c', quantity: 3 },
    ])

    expect(result).toEqual({ success: false, failedProductId: 'prod_b' })
    expect(reserveStockSpy).toHaveBeenCalledTimes(2)
    reserveStockSpy.mockRestore()
  })

  it('retorna stock virtual para productos ilimitados en getProductStock', async () => {
    productFindUniqueMock.mockResolvedValue({
      id: 'prod_3',
      stockType: 'UNLIMITED',
      weeklyStock: 0,
      isActive: true,
      published: true,
    })

    const { stockManager } = await stockManagerModulePromise
    const result = await stockManager.getProductStock('prod_3')

    expect(result).toEqual({
      maxStock: Number.MAX_SAFE_INTEGER,
      currentStock: Number.MAX_SAFE_INTEGER,
      reservedStock: 0,
      availableStock: Number.MAX_SAFE_INTEGER,
    })
  })
})