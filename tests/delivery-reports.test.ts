import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const orderFindManyMock = vi.fn()
const personFindManyMock = vi.fn()
const zoneFindManyMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findMany: orderFindManyMock,
    },
    deliveryPerson: {
      findMany: personFindManyMock,
    },
    deliveryZone: {
      findMany: zoneFindManyMock,
    },
  },
}))

const libPromise = import('@/lib/delivery-reports')
const routePromise = import('@/app/api/admin/delivery-reports/route')

function buildRequest(search: string) {
  return new NextRequest(`http://localhost/api/admin/delivery-reports${search}`, {
    method: 'GET',
  })
}

function makeOrder(overrides: {
  id?: string
  status?: string
  deliveryDate?: string
  deliveredAt?: string | null
  assignment?: { assignedAt?: string | null; deliveredAt?: string | null; deliveryPersonId?: string | null } | null
  deliveryZoneId?: string | null
} = {}) {
  return {
    id: overrides.id ?? 'ord1',
    orderNumber: `TBK-${overrides.id ?? '0001'}`,
    status: overrides.status ?? 'DELIVERED',
    deliveryMethod: 'LOCAL_DELIVERY',
    deliveryDate: overrides.deliveryDate ? new Date(overrides.deliveryDate) : null,
    deliveredAt: overrides.deliveredAt ? new Date(overrides.deliveredAt) : null,
    deliveryZoneId: overrides.deliveryZoneId ?? 'z1',
    deliveryZone: { id: 'z1', name: 'Centro' },
    assignment: overrides.assignment === undefined
      ? {
          assignedAt: new Date('2026-09-20T10:00:00.000Z'),
          deliveredAt: overrides.deliveredAt ? new Date(overrides.deliveredAt) : null,
          deliveryPersonId: 'p1',
          deliveryPerson: { id: 'p1', name: 'Ana García' },
          attempts: [{ id: 'att1' }],
        }
      : overrides.assignment,
  }
}

const zone1 = { id: 'z1', name: 'Centro', isActive: true }
const zone2 = { id: 'z2', name: 'Norte', isActive: true }
const person1 = { id: 'p1', name: 'Ana García', isActive: true }
const person2 = { id: 'p2', name: 'Carlos López', isActive: true }

describe('delivery-reports lib', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateSuccessRate', () => {
    it('calculates delivered / (delivered + failed) * 100', async () => {
      const { calculateSuccessRate } = await libPromise
      const orders = [
        makeOrder({ id: 'o1', status: 'DELIVERED' }),
        makeOrder({ id: 'o2', status: 'DELIVERED' }),
        makeOrder({ id: 'o3', status: 'DELIVERY_FAILED' }),
      ]
      expect(calculateSuccessRate(orders)).toBeCloseTo(66.67, 1)
    })

    it('returns 0 when there are no delivered or failed orders', async () => {
      const { calculateSuccessRate } = await libPromise
      const orders = [
        makeOrder({ id: 'o1', status: 'OUT_FOR_DELIVERY' }),
        makeOrder({ id: 'o2', status: 'READY' }),
      ]
      expect(calculateSuccessRate(orders)).toBe(0)
    })

    it('returns 100 when all relevant orders are delivered', async () => {
      const { calculateSuccessRate } = await libPromise
      const orders = [
        makeOrder({ id: 'o1', status: 'DELIVERED' }),
        makeOrder({ id: 'o2', status: 'DELIVERED' }),
      ]
      expect(calculateSuccessRate(orders)).toBe(100)
    })
  })

  describe('calculateAverageMinutes', () => {
    it('averages deliveredAt - assignedAt for delivered orders', async () => {
      const { calculateAverageMinutes } = await libPromise
      const orders = [
        makeOrder({
          id: 'o1',
          status: 'DELIVERED',
          deliveredAt: '2026-09-20T10:30:00.000Z',
          assignment: { assignedAt: '2026-09-20T10:00:00.000Z', deliveredAt: '2026-09-20T10:30:00.000Z', deliveryPersonId: 'p1' },
        }),
        makeOrder({
          id: 'o2',
          status: 'DELIVERED',
          deliveredAt: '2026-09-20T11:00:00.000Z',
          assignment: { assignedAt: '2026-09-20T10:00:00.000Z', deliveredAt: '2026-09-20T11:00:00.000Z', deliveryPersonId: 'p1' },
        }),
      ]
      expect(calculateAverageMinutes(orders)).toBe(45)
    })

    it('returns null when no assignment exists', async () => {
      const { calculateAverageMinutes } = await libPromise
      const orders = [
        makeOrder({ id: 'o1', status: 'DELIVERED', assignment: null }),
      ]
      expect(calculateAverageMinutes(orders)).toBeNull()
    })

    it('returns null when deliveredAt is missing', async () => {
      const { calculateAverageMinutes } = await libPromise
      const orders = [
        makeOrder({
          id: 'o1',
          status: 'DELIVERED',
          deliveredAt: null,
          assignment: { assignedAt: '2026-09-20T10:00:00.000Z', deliveredAt: null, deliveryPersonId: 'p1' },
        }),
      ]
      expect(calculateAverageMinutes(orders)).toBeNull()
    })

    it('ignores non-delivered orders in average', async () => {
      const { calculateAverageMinutes } = await libPromise
      const orders = [
        makeOrder({
          id: 'o1',
          status: 'DELIVERED',
          deliveredAt: '2026-09-20T10:30:00.000Z',
          assignment: { assignedAt: '2026-09-20T10:00:00.000Z', deliveredAt: '2026-09-20T10:30:00.000Z', deliveryPersonId: 'p1' },
        }),
        makeOrder({
          id: 'o2',
          status: 'DELIVERY_FAILED',
          deliveredAt: null,
          assignment: { assignedAt: '2026-09-20T10:00:00.000Z', deliveredAt: null, deliveryPersonId: 'p1' },
        }),
      ]
      expect(calculateAverageMinutes(orders)).toBe(30)
    })
  })

  describe('exclude statuses', () => {
    it('excludes CANCELLED and REFUNDED from metrics counts', async () => {
      const { buildReport } = await libPromise
      const orders = [
        makeOrder({ id: 'o1', status: 'DELIVERED' }),
        makeOrder({ id: 'o2', status: 'CANCELLED' }),
        makeOrder({ id: 'o3', status: 'REFUNDED' }),
        makeOrder({ id: 'o4', status: 'DELIVERY_FAILED' }),
      ]
      const report = buildReport(orders)
      expect(report.summary.total).toBe(2)
      expect(report.summary.delivered).toBe(1)
      expect(report.summary.failed).toBe(1)
      expect(report.byStatus.some((s: { status: string }) => s.status === 'CANCELLED')).toBe(false)
      expect(report.byStatus.some((s: { status: string }) => s.status === 'REFUNDED')).toBe(false)
    })
  })

  describe('groupByDay', () => {
    it('groups delivered and failed counts by delivery date', async () => {
      const { groupByDay } = await libPromise
      const orders = [
        makeOrder({ id: 'o1', status: 'DELIVERED', deliveryDate: '2026-09-20T00:00:00.000Z' }),
        makeOrder({ id: 'o2', status: 'DELIVERED', deliveryDate: '2026-09-20T00:00:00.000Z' }),
        makeOrder({ id: 'o3', status: 'DELIVERY_FAILED', deliveryDate: '2026-09-21T00:00:00.000Z' }),
      ]
      const result = groupByDay(orders)
      expect(result).toHaveLength(2)
      const day20 = result.find((d: { date: string }) => d.date === '2026-09-20')
      const day21 = result.find((d: { date: string }) => d.date === '2026-09-21')
      expect(day20?.delivered).toBe(2)
      expect(day21?.failed).toBe(1)
    })
  })

  describe('buildReport', () => {
    it('returns empty state when no data', async () => {
      const { buildReport } = await libPromise
      const report = buildReport([])
      expect(report.summary.total).toBe(0)
      expect(report.summary.successRate).toBe(0)
      expect(report.summary.avgMinutes).toBeNull()
      expect(report.perDay).toEqual([])
      expect(report.byPerson).toEqual([])
      expect(report.byZone).toEqual([])
      expect(report.byStatus).toEqual([])
      expect(report.orders).toEqual([])
    })

    it('builds full report structure', async () => {
      const { buildReport } = await libPromise
      const orders = [
        makeOrder({ id: 'o1', status: 'DELIVERED', deliveryDate: '2026-09-20T00:00:00.000Z', deliveryZoneId: 'z1' }),
        makeOrder({ id: 'o2', status: 'DELIVERY_FAILED', deliveryDate: '2026-09-20T00:00:00.000Z', deliveryZoneId: 'z1' }),
      ]
      const report = buildReport(orders)
      expect(report.summary.total).toBe(2)
      expect(report.summary.delivered).toBe(1)
      expect(report.summary.failed).toBe(1)
      expect(report.summary.successRate).toBe(50)
      expect(report.perDay).toHaveLength(1)
      expect(report.byPerson).toHaveLength(1)
      expect(report.byZone).toHaveLength(1)
      expect(report.byStatus).toHaveLength(2)
      expect(report.orders).toHaveLength(2)
      expect(report.orders[0].attemptsCount).toBe(1)
    })
  })
})

describe('GET /api/admin/delivery-reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    personFindManyMock.mockResolvedValue([person1, person2])
    zoneFindManyMock.mockResolvedValue([zone1, zone2])
  })

  it('returns summary, perDay, byPerson, byZone, byStatus and orders', async () => {
    orderFindManyMock.mockResolvedValue([
      makeOrder({ id: 'o1', status: 'DELIVERED', deliveryDate: '2026-09-20T00:00:00.000Z' }),
      makeOrder({ id: 'o2', status: 'DELIVERY_FAILED', deliveryDate: '2026-09-20T00:00:00.000Z' }),
    ])

    const { GET } = await routePromise
    const response = await GET(buildRequest('?dateFrom=2026-09-20T00:00:00.000Z&dateTo=2026-09-20T23:59:59.999Z'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.summary.total).toBe(2)
    expect(body.summary.delivered).toBe(1)
    expect(body.summary.failed).toBe(1)
    expect(body.perDay).toHaveLength(1)
    expect(body.byPerson).toHaveLength(1)
    expect(body.byZone).toHaveLength(1)
    expect(body.byStatus).toHaveLength(2)
    expect(body.orders).toHaveLength(2)
    expect(body.zones).toHaveLength(2)
    expect(body.persons).toHaveLength(2)
  })

  it('filters by date range', async () => {
    orderFindManyMock.mockResolvedValue([
      makeOrder({ id: 'o1', status: 'DELIVERED', deliveryDate: '2026-09-20T00:00:00.000Z' }),
    ])

    const { GET } = await routePromise
    await GET(buildRequest('?dateFrom=2026-09-20T00:00:00.000Z&dateTo=2026-09-20T23:59:59.999Z'))

    expect(orderFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deliveryDate: expect.objectContaining({
            gte: new Date('2026-09-20T00:00:00.000Z'),
            lte: new Date('2026-09-20T23:59:59.999Z'),
          }),
        }),
      })
    )
  })

  it('filters by courier, zone and status', async () => {
    orderFindManyMock.mockResolvedValue([
      makeOrder({ id: 'o1', status: 'DELIVERED', deliveryDate: '2026-09-20T00:00:00.000Z', deliveryZoneId: 'z2' }),
    ])

    const { GET } = await routePromise
    const response = await GET(buildRequest('?personId=p2&zoneId=z2&status=DELIVERED'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.summary.total).toBe(1)
    expect(orderFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          assignment: expect.objectContaining({ deliveryPersonId: 'p2' }),
          deliveryZoneId: 'z2',
          status: 'DELIVERED',
        }),
      })
    )
  })

  it('returns empty state when filters return no results', async () => {
    orderFindManyMock.mockResolvedValue([])

    const { GET } = await routePromise
    const response = await GET(buildRequest('?status=DELIVERED'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.summary.total).toBe(0)
    expect(body.summary.avgMinutes).toBeNull()
    expect(body.orders).toEqual([])
  })

  it('returns 400 for invalid date format', async () => {
    const { GET } = await routePromise
    const response = await GET(buildRequest('?dateFrom=not-a-date'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('inválidos')
  })
})
