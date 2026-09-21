import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deliveryAssignmentSchema } from '@/types/delivery'
import { apiError, apiDbError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [assignableOrders, assignments] = await Promise.all([
      prisma.order.findMany({
        where: {
          deletedAt: null,
          deliveryMethod: 'LOCAL_DELIVERY',
          status: { in: ['READY', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'DELIVERED'] },
        },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          status: true,
          deliveryMethod: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.deliveryAssignment.findMany({
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              status: true,
            },
          },
          deliveryPerson: {
            select: { id: true, name: true },
          },
        },
        orderBy: { assignedAt: 'desc' },
      }),
    ])

    return NextResponse.json({ assignableOrders, assignments })
  } catch (error) {
    console.error('Error fetching delivery assignments:', error)
    return apiDbError(error, 'Error al obtener asignaciones')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = deliveryAssignmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { orderId, deliveryPersonId } = parsed.data

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, deliveryMethod: true },
    })

    if (!order) {
      return apiError('Pedido no encontrado', 404)
    }

    if (order.deliveryMethod !== 'LOCAL_DELIVERY') {
      return apiError('La asignación solo está disponible para pedidos con envío local', 400)
    }

    if (order.status !== 'READY') {
      return apiError('El pedido debe estar en estado READY para asignar un repartidor', 400)
    }

    const person = await prisma.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
      select: { id: true, name: true, isActive: true },
    })

    if (!person) {
      return apiError('Repartidor no encontrado', 404)
    }

    if (!person.isActive) {
      return apiError('El repartidor debe estar activo para ser asignado', 400)
    }

    const assignment = await prisma.deliveryAssignment.upsert({
      where: { orderId },
      update: {
        deliveryPersonId,
        status: 'ASSIGNED',
      },
      create: {
        orderId,
        deliveryPersonId,
        status: 'ASSIGNED',
      },
      include: {
        deliveryPerson: {
          select: { id: true, name: true },
        },
      },
    })

    await prisma.deliveryAttempt.create({
      data: {
        assignmentId: assignment.id,
        deliveryPersonId,
        status: 'ASSIGNED',
        success: true,
      },
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Error creating delivery assignment:', error)
    return apiDbError(error, 'Error al asignar repartidor')
  }
}
