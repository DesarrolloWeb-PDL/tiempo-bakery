import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['PENDING', 'PAID', 'BAKING', 'READY', 'DELIVERED', 'CANCELLED'] as const

const updateSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  adminNotes: z.string().max(1000).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: { slug: true, imageUrl: true, imageAlt: true },
            },
          },
        },
        user: { select: { id: true, email: true, name: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Error al obtener el pedido' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { status, adminNotes } = parsed.data

    const existing = await db.order.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
        ...(status === 'DELIVERED' && !existing.deliveredAt && { deliveredAt: new Date() }),
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        adminNotes: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 })
  }
}
