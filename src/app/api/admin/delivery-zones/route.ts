import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deliveryZoneSchema } from '@/types/delivery'
import { apiError, apiDbError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

// GET: Listar todas las zonas de entrega ordenadas por "order"
export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ zones })
  } catch (error) {
    console.error('Error fetching delivery zones:', error)
    return apiDbError(error, 'Error al obtener zonas de entrega')
  }
}

// POST: Crear una nueva zona de entrega
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = deliveryZoneSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const zone = await prisma.deliveryZone.create({ data: parsed.data })
    return NextResponse.json({ zone }, { status: 201 })
  } catch (error) {
    console.error('Error creating delivery zone:', error)
    return apiDbError(error, 'Error al crear zona de entrega')
  }
}

// PUT: Actualizar una zona de entrega existente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body

    if (!id || typeof id !== 'string') {
      return apiError('Falta el id de la zona', 400)
    }

    const parsed = deliveryZoneSchema.safeParse(rest)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ zone })
  } catch (error) {
    console.error('Error updating delivery zone:', error)
    return apiDbError(error, 'Error al actualizar zona de entrega')
  }
}

// DELETE: Eliminar una zona si no tiene pedidos; de lo contrario desactivarla
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return apiError('Falta el id de la zona', 400)
    }

    const referencedOrders = await prisma.order.count({
      where: { deliveryZoneId: id },
    })

    if (referencedOrders > 0) {
      await prisma.deliveryZone.update({
        where: { id },
        data: { isActive: false },
      })
    } else {
      await prisma.deliveryZone.delete({ where: { id } })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting delivery zone:', error)
    return apiDbError(error, 'Error al eliminar zona de entrega')
  }
}
