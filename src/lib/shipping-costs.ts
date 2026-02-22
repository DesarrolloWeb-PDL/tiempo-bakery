import { prisma } from './db'

export interface ShippingCosts {
  pickupPoint: number
  localDelivery: number
  nationalCourier: number
}

export const DEFAULT_SHIPPING_COSTS: ShippingCosts = {
  pickupPoint: 0,
  localDelivery: 3500,
  nationalCourier: 5950,
}

function parseAmount(value: string | undefined, fallback: number) {
  if (value == null) return fallback
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(0, parsed)
}

export async function getShippingCostsRuntime(): Promise<ShippingCosts> {
  try {
    const rows = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: ['shipping_cost_local', 'shipping_cost_national'],
        },
      },
    })

    const map = new Map(rows.map((row) => [row.key, row.value]))

    return {
      pickupPoint: 0,
      localDelivery: parseAmount(map.get('shipping_cost_local'), DEFAULT_SHIPPING_COSTS.localDelivery),
      nationalCourier: parseAmount(map.get('shipping_cost_national'), DEFAULT_SHIPPING_COSTS.nationalCourier),
    }
  } catch (error) {
    console.error('Error loading shipping costs, using defaults:', error)
    return DEFAULT_SHIPPING_COSTS
  }
}

export function getShippingCostByMethod(method: string, costs: ShippingCosts): number {
  if (method === 'PICKUP_POINT') return costs.pickupPoint
  if (method === 'LOCAL_DELIVERY') return costs.localDelivery
  if (method === 'NATIONAL_COURIER') return costs.nationalCourier
  return 0
}
