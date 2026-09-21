import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const deliveryZoneFindManyMock = vi.fn()
const orderCountMock = vi.fn()
const scheduleFindManyMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    deliveryZone: {
      findMany: deliveryZoneFindManyMock,
    },
    order: {
      count: orderCountMock,
    },
    deliverySchedule: {
      findMany: scheduleFindManyMock,
    },
  },
}))

const routeModulePromise = import('@/app/api/delivery-options/route')

describe('GET /api/delivery-options', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns active zones and available days', async () => {
    deliveryZoneFindManyMock.mockResolvedValue([
      {
        id: 'z1',
        name: 'Centro',
        neighborhoods: ['Palermo'],
        shippingCost: 2500,
        minOrderFree: 15000,
        isActive: true,
        order: 1,
      },
      {
        id: 'z2',
        name: 'Norte',
        neighborhoods: ['Alameda'],
        shippingCost: 3000,
        minOrderFree: null,
        isActive: true,
        order: 2,
      },
    ])

    scheduleFindManyMock.mockResolvedValue([
      {
        id: 'slot-fri',
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '14:00',
        maxOrders: 10,
        cutoffDay: null,
        cutoffTime: null,
        isActive: true,
      },
    ])
    orderCountMock.mockResolvedValue(3)

    const { GET } = await routeModulePromise
    const response = await GET(
      new NextRequest('http://localhost/api/delivery-options?horizon=7')
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.zones).toHaveLength(2)
    expect(body.zones[0]).toMatchObject({
      id: 'z1',
      name: 'Centro',
      shippingCost: 2500,
      minOrderFree: 15000,
    })
    expect(body.days).toHaveLength(1)
    expect(body.days[0].date).toBeDefined()
    expect(body.days[0].slot.id).toBe('slot-fri')
  })

  it('returns empty zones and days when nothing is configured', async () => {
    deliveryZoneFindManyMock.mockResolvedValue([])
    scheduleFindManyMock.mockResolvedValue([])

    const { GET } = await routeModulePromise
    const response = await GET(new NextRequest('http://localhost/api/delivery-options'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.zones).toEqual([])
    expect(body.days).toEqual([])
  })

  it('hides unavailable days from the response', async () => {
    deliveryZoneFindManyMock.mockResolvedValue([])
    scheduleFindManyMock.mockResolvedValue([
      {
        id: 'slot-fri',
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '14:00',
        maxOrders: 5,
        cutoffDay: null,
        cutoffTime: null,
        isActive: true,
      },
    ])
    orderCountMock.mockResolvedValue(5)

    const { GET } = await routeModulePromise
    const response = await GET(
      new NextRequest('http://localhost/api/delivery-options?horizon=7')
    )
    const body = await response.json()

    expect(body.days).toEqual([])
  })

  it('returns 500 on database errors', async () => {
    deliveryZoneFindManyMock.mockRejectedValue(new Error('DB failure'))

    const { GET } = await routeModulePromise
    const response = await GET(new NextRequest('http://localhost/api/delivery-options'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBeDefined()
  })
})
