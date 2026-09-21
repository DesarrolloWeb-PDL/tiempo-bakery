import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deliveryAttemptSchema } from '@/types/delivery'
import { apiError, apiDbError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await req.json()
    const parsed = deliveryAttemptSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { status, success, reason, deliveryPersonId } = parsed.data

    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { orderId: params.orderId },
      select: { id: true, deliveryPersonId: true },
    })

    if (!assignment) {
      return apiError('No hay una asignación para este pedido', 404)
    }

    const attempt = await prisma.deliveryAttempt.create({
      data: {
        assignmentId: assignment.id,
        deliveryPersonId: deliveryPersonId ?? assignment.deliveryPersonId,
        status,
        success,
        reason,
      },
    })

    return NextResponse.json({ attempt }, { status: 201 })
  } catch (error) {
    console.error('Error logging delivery attempt:', error)
    return apiDbError(error, 'Error al registrar intento de entrega')
  }
}
