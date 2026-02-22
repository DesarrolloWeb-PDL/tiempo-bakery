import { NextResponse } from 'next/server'
import { getShippingCostsRuntime } from '@/lib/shipping-costs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const costs = await getShippingCostsRuntime()
    return NextResponse.json(costs)
  } catch (error) {
    console.error('Error fetching public shipping costs:', error)
    return NextResponse.json({ error: 'Error al obtener costos de envío' }, { status: 500 })
  }
}
