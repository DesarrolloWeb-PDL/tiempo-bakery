import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSlotsForCheckout } from '@/lib/delivery-availability'
import { apiError, apiSuccess } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const horizon = Number(searchParams.get('horizon') ?? '14')

    const zones = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        shippingCost: true,
        minOrderFree: true,
        order: true,
      },
    })

    const days = await getSlotsForCheckout(new Date(), Math.max(1, Math.min(horizon, 60)))

    return apiSuccess({ zones, days })
  } catch (error) {
    console.error('Error fetching delivery options:', error)
    return apiError('Error al obtener opciones de entrega', 500)
  }
}
