import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'
import { normalizePublicAssetUrl } from '@/lib/url-normalizer'
import { timeGating } from '@/lib/time-gating'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['PENDING', 'PAID', 'BAKING', 'READY', 'DELIVERED', 'CANCELLED'] as const
const VALID_PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'] as const

const updateSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  paymentStatus: z.enum(VALID_PAYMENT_STATUSES).optional(),
  adminNotes: z.string().max(1000).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.id, deletedAt: null },
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

    return NextResponse.json({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          imageUrl: normalizePublicAssetUrl(item.product.imageUrl),
        },
      })),
    })
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

    const { status, paymentStatus, adminNotes } = parsed.data

    const existing = await db.order.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(paymentStatus !== undefined && { paymentStatus }),
        ...(status === 'DELIVERED' && !existing.deliveredAt && { deliveredAt: new Date() }),
        ...(paymentStatus === 'PAID' && existing.paymentStatus !== 'PAID' && { paidAt: new Date() }),
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: { select: { productId: true, quantity: true } },
      },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const weekId = timeGating.getCurrentWeekId()

    await db.$transaction(async (tx) => {
      for (const item of existing.items) {
        if (existing.paymentStatus === 'PAID') {
          await tx.$queryRaw`
            UPDATE "WeeklyStock"
            SET "currentStock" = "currentStock" + ${item.quantity},
                "reservedStock" = "reservedStock" + ${item.quantity},
                "updatedAt" = NOW()
            WHERE "productId" = ${item.productId}
              AND "weekId" = ${weekId}
          `
        } else {
          await tx.$queryRaw`
            UPDATE "WeeklyStock"
            SET "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity}),
                "updatedAt" = NOW()
            WHERE "productId" = ${item.productId}
              AND "weekId" = ${weekId}
              AND "reservedStock" >= ${item.quantity}
          `
        }
      }

      await tx.order.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Error al eliminar el pedido' }, { status: 500 })
  }
}
