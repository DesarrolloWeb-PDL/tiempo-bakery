import { beforeEach, describe, expect, it, vi } from 'vitest'

const scheduleFindManyMock = vi.fn()
const scheduleFindUniqueMock = vi.fn()
const orderCountMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    deliverySchedule: {
      findMany: scheduleFindManyMock,
      findUnique: scheduleFindUniqueMock,
    },
    order: {
      count: orderCountMock,
    },
  },
}))

const libPromise = import('@/lib/delivery-availability')

function makeFridaySlot(overrides: Partial<{
  id: string
  maxOrders: number | null
  cutoffDay: number | null
  cutoffTime: string | null
  isActive: boolean
}> = {}) {
  return {
    id: 'slot-fri',
    dayOfWeek: 5,
    startTime: '09:00',
    endTime: '14:00',
    maxOrders: 10,
    cutoffDay: null,
    cutoffTime: null,
    isActive: true,
    ...overrides,
  }
}

describe('delivery-availability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAvailableSlots', () => {
    it('returns active slots for the requested date with order counts', async () => {
      const deliveryDate = new Date('2026-09-18T00:00:00Z')
      scheduleFindManyMock.mockResolvedValue([makeFridaySlot()])
      orderCountMock.mockResolvedValue(3)

      const { getAvailableSlots } = await libPromise
      const result = await getAvailableSlots(deliveryDate)

      expect(scheduleFindManyMock).toHaveBeenCalledWith({
        where: { isActive: true, dayOfWeek: 5 },
        orderBy: { startTime: 'asc' },
      })
      expect(orderCountMock).toHaveBeenCalledWith({
        where: {
          deliveryScheduleId: 'slot-fri',
          deliveryDate: {
            gte: new Date('2026-09-18T00:00:00.000Z'),
            lte: new Date('2026-09-18T23:59:59.999Z'),
          },
          status: { not: 'CANCELLED' },
          deletedAt: null,
        },
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'slot-fri',
        currentOrders: 3,
        remaining: 7,
        available: true,
      })
    })

    it('returns empty array when no active slots exist for the day', async () => {
      const deliveryDate = new Date('2026-09-18T00:00:00Z')
      scheduleFindManyMock.mockResolvedValue([])

      const { getAvailableSlots } = await libPromise
      const result = await getAvailableSlots(deliveryDate)

      expect(result).toEqual([])
      expect(orderCountMock).not.toHaveBeenCalled()
    })

    it('marks slot unavailable when capacity is full', async () => {
      const deliveryDate = new Date('2026-09-18T00:00:00Z')
      scheduleFindManyMock.mockResolvedValue([makeFridaySlot({ maxOrders: 5 })])
      orderCountMock.mockResolvedValue(5)

      const { getAvailableSlots } = await libPromise
      const result = await getAvailableSlots(deliveryDate)

      expect(result[0].available).toBe(false)
      expect(result[0].remaining).toBe(0)
    })

    it('treats missing maxOrders as unlimited capacity', async () => {
      const deliveryDate = new Date('2026-09-18T00:00:00Z')
      scheduleFindManyMock.mockResolvedValue([makeFridaySlot({ maxOrders: null })])
      orderCountMock.mockResolvedValue(999)

      const { getAvailableSlots } = await libPromise
      const result = await getAvailableSlots(deliveryDate)

      expect(result[0].available).toBe(true)
      expect(result[0].remaining).toBe(Infinity)
    })
  })

  describe('isSlotAvailable', () => {
    it('returns true when capacity remains and no cutoff is set', async () => {
      const deliveryDate = new Date('2026-09-18T00:00:00Z')
      scheduleFindUniqueMock.mockResolvedValue(makeFridaySlot())
      orderCountMock.mockResolvedValue(2)

      const { isSlotAvailable } = await libPromise
      const result = await isSlotAvailable('slot-fri', deliveryDate)

      expect(result).toBe(true)
    })

    it('returns false when capacity is reached', async () => {
      const deliveryDate = new Date('2026-09-18T00:00:00Z')
      scheduleFindUniqueMock.mockResolvedValue(makeFridaySlot({ maxOrders: 5 }))
      orderCountMock.mockResolvedValue(5)

      const { isSlotAvailable } = await libPromise
      const result = await isSlotAvailable('slot-fri', deliveryDate)

      expect(result).toBe(false)
    })

    it('returns false when cutoff has passed', async () => {
      const deliveryDate = new Date('2026-09-18T00:00:00Z')
      const now = new Date('2026-09-17T09:00:00Z')
      scheduleFindUniqueMock.mockResolvedValue(
        makeFridaySlot({ cutoffDay: 3, cutoffTime: '18:00' })
      )
      orderCountMock.mockResolvedValue(0)

      const { isSlotAvailable } = await libPromise
      const result = await isSlotAvailable('slot-fri', deliveryDate, now)

      expect(result).toBe(false)
    })

    it('returns true when cutoff has not passed', async () => {
      const deliveryDate = new Date('2026-09-18T00:00:00Z')
      const now = new Date('2026-09-15T10:00:00Z')
      scheduleFindUniqueMock.mockResolvedValue(
        makeFridaySlot({ cutoffDay: 3, cutoffTime: '18:00' })
      )
      orderCountMock.mockResolvedValue(0)

      const { isSlotAvailable } = await libPromise
      const result = await isSlotAvailable('slot-fri', deliveryDate, now)

      expect(result).toBe(true)
    })

    it('returns false for an inactive slot', async () => {
      const deliveryDate = new Date('2026-09-18T00:00:00Z')
      scheduleFindUniqueMock.mockResolvedValue(makeFridaySlot({ isActive: false }))

      const { isSlotAvailable } = await libPromise
      const result = await isSlotAvailable('slot-fri', deliveryDate)

      expect(result).toBe(false)
      expect(orderCountMock).not.toHaveBeenCalled()
    })
  })

  describe('getSlotsForCheckout', () => {
    it('hides a day that has reached capacity', async () => {
      const now = new Date('2026-09-14T10:00:00Z')
      scheduleFindManyMock.mockResolvedValue([makeFridaySlot({ maxOrders: 5 })])
      orderCountMock.mockResolvedValue(5)

      const { getSlotsForCheckout } = await libPromise
      const result = await getSlotsForCheckout(now)

      expect(result).toEqual([])
    })

    it('shows an available upcoming day without a cutoff', async () => {
      const now = new Date('2026-09-14T10:00:00Z')
      scheduleFindManyMock.mockResolvedValue([makeFridaySlot()])
      orderCountMock.mockResolvedValue(2)

      const { getSlotsForCheckout } = await libPromise
      const result = await getSlotsForCheckout(now, 7)

      expect(result).toHaveLength(1)
      expect(result[0].slot.id).toBe('slot-fri')
      expect(result[0].date.toISOString()).toBe('2026-09-18T00:00:00.000Z')
    })

    it('hides a day after its cutoff', async () => {
      const now = new Date('2026-09-17T09:00:00Z')
      scheduleFindManyMock.mockResolvedValue([
        makeFridaySlot({ cutoffDay: 3, cutoffTime: '18:00' }),
      ])
      orderCountMock.mockResolvedValue(0)

      const { getSlotsForCheckout } = await libPromise
      const result = await getSlotsForCheckout(now, 7)

      expect(result.some((r) => r.date.toISOString().startsWith('2026-09-18'))).toBe(false)
    })

    it('shows a day before its cutoff', async () => {
      const now = new Date('2026-09-15T10:00:00Z')
      scheduleFindManyMock.mockResolvedValue([
        makeFridaySlot({ cutoffDay: 3, cutoffTime: '18:00' }),
      ])
      orderCountMock.mockResolvedValue(0)

      const { getSlotsForCheckout } = await libPromise
      const result = await getSlotsForCheckout(now, 7)

      expect(result).toHaveLength(1)
      expect(result[0].date.toISOString()).toBe('2026-09-18T00:00:00.000Z')
    })

    it('returns multiple occurrences within the horizon', async () => {
      const now = new Date('2026-09-14T10:00:00Z')
      scheduleFindManyMock.mockResolvedValue([makeFridaySlot()])
      orderCountMock.mockResolvedValue(0)

      const { getSlotsForCheckout } = await libPromise
      const result = await getSlotsForCheckout(now, 21)

      const fridays = result.filter(
        (r) =>
          r.date.toISOString().startsWith('2026-09-18') ||
          r.date.toISOString().startsWith('2026-09-25')
      )
      expect(fridays).toHaveLength(2)
    })
  })
})
