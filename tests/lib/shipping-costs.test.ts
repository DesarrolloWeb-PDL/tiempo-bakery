import { beforeEach, describe, expect, it, vi } from 'vitest'

const deliveryZoneFindUniqueMock = vi.fn()
const siteConfigFindManyMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    deliveryZone: { findUnique: deliveryZoneFindUniqueMock },
    siteConfig: { findMany: siteConfigFindManyMock },
  },
}))

const libPromise = import('@/lib/shipping-costs')

describe('shipping-costs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getLocalDeliveryShippingCost', () => {
    it('returns active zone shipping cost when zone exists', async () => {
      deliveryZoneFindUniqueMock.mockResolvedValue({
        id: 'z1',
        name: 'Centro',
        shippingCost: 2500,
        minOrderFree: null,
        isActive: true,
      })

      const { getLocalDeliveryShippingCost } = await libPromise
      const result = await getLocalDeliveryShippingCost('z1', 1000)

      expect(result).toBe(2500)
      expect(deliveryZoneFindUniqueMock).toHaveBeenCalledWith({ where: { id: 'z1' } })
    })

    it('returns 0 when order total reaches zone free-delivery minimum', async () => {
      deliveryZoneFindUniqueMock.mockResolvedValue({
        id: 'z1',
        name: 'Centro',
        shippingCost: 2500,
        minOrderFree: 15000,
        isActive: true,
      })

      const { getLocalDeliveryShippingCost } = await libPromise
      const result = await getLocalDeliveryShippingCost('z1', 15000)

      expect(result).toBe(0)
    })

    it('falls back to SiteConfig flat rate when zone is not found', async () => {
      deliveryZoneFindUniqueMock.mockResolvedValue(null)
      siteConfigFindManyMock.mockResolvedValue([
        { key: 'shipping_cost_local', value: '3500' },
      ])

      const { getLocalDeliveryShippingCost } = await libPromise
      const result = await getLocalDeliveryShippingCost('missing', 1000)

      expect(result).toBe(3500)
    })

    it('falls back to default when no zone id is provided', async () => {
      siteConfigFindManyMock.mockResolvedValue([])

      const { getLocalDeliveryShippingCost } = await libPromise
      const result = await getLocalDeliveryShippingCost(undefined, 1000)

      expect(result).toBe(3500)
      expect(deliveryZoneFindUniqueMock).not.toHaveBeenCalled()
    })

    it('falls back to default when zone is inactive', async () => {
      deliveryZoneFindUniqueMock.mockResolvedValue({
        id: 'z1',
        name: 'Centro',
        shippingCost: 2500,
        minOrderFree: null,
        isActive: false,
      })
      siteConfigFindManyMock.mockResolvedValue([])

      const { getLocalDeliveryShippingCost } = await libPromise
      const result = await getLocalDeliveryShippingCost('z1', 1000)

      expect(result).toBe(3500)
    })
  })
})
