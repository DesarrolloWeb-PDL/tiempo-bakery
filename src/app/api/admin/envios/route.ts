import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'
import { DEFAULT_SHIPPING_COSTS, getShippingCostsRuntime } from '@/lib/shipping-costs'

export const dynamic = 'force-dynamic'

const schema = z.object({
  localDelivery: z.number().min(0),
  nationalCourier: z.number().min(0),
})

export async function GET() {
  try {
    const costs = await getShippingCostsRuntime()
    return NextResponse.json(costs)
  } catch (error) {
    console.error('Error fetching shipping costs:', error)
    return NextResponse.json({ error: 'Error al obtener costos de envío' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    await db.$transaction([
      db.siteConfig.upsert({
        where: { key: 'shipping_cost_local' },
        create: { key: 'shipping_cost_local', value: String(parsed.data.localDelivery) },
        update: { value: String(parsed.data.localDelivery) },
      }),
      db.siteConfig.upsert({
        where: { key: 'shipping_cost_national' },
        create: { key: 'shipping_cost_national', value: String(parsed.data.nationalCourier) },
        update: { value: String(parsed.data.nationalCourier) },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating shipping costs:', error)
    return NextResponse.json({ error: 'Error al guardar costos de envío' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await db.$transaction([
      db.siteConfig.upsert({
        where: { key: 'shipping_cost_local' },
        create: { key: 'shipping_cost_local', value: String(DEFAULT_SHIPPING_COSTS.localDelivery) },
        update: { value: String(DEFAULT_SHIPPING_COSTS.localDelivery) },
      }),
      db.siteConfig.upsert({
        where: { key: 'shipping_cost_national' },
        create: { key: 'shipping_cost_national', value: String(DEFAULT_SHIPPING_COSTS.nationalCourier) },
        update: { value: String(DEFAULT_SHIPPING_COSTS.nationalCourier) },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting shipping costs:', error)
    return NextResponse.json({ error: 'Error al restablecer costos de envío' }, { status: 500 })
  }
}
