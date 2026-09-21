import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deliveryScheduleSchema } from '@/types/delivery'
import { apiError, apiDbError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

// GET: Listar todos los slots de entrega ordenados por día de la semana
export async function GET() {
  try {
    const schedules = await prisma.deliverySchedule.findMany({
      orderBy: { dayOfWeek: 'asc' },
    })
    return NextResponse.json({ schedules: schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek) })
  } catch (error) {
    console.error('Error fetching delivery schedule:', error)
    return apiDbError(error, 'Error al obtener horarios de entrega')
  }
}

// POST: Crear un nuevo slot de entrega
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = deliveryScheduleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { dayOfWeek, isActive } = parsed.data

    if (isActive) {
      const existing = await prisma.deliverySchedule.count({
        where: { isActive: true, dayOfWeek },
      })

      if (existing > 0) {
        return apiError('Ya existe un slot activo para ese día de la semana', 409)
      }
    }

    const schedule = await prisma.deliverySchedule.create({ data: parsed.data })
    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error('Error creating delivery schedule:', error)
    return apiDbError(error, 'Error al crear horario de entrega')
  }
}

// PUT: Actualizar un slot de entrega existente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body

    if (!id || typeof id !== 'string') {
      return apiError('Falta el id del horario', 400)
    }

    const parsed = deliveryScheduleSchema.safeParse(rest)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { dayOfWeek, isActive } = parsed.data

    if (isActive) {
      const existing = await prisma.deliverySchedule.count({
        where: { isActive: true, dayOfWeek, id: { not: id } },
      })

      if (existing > 0) {
        return apiError('Ya existe un slot activo para ese día de la semana', 409)
      }
    }

    const schedule = await prisma.deliverySchedule.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error updating delivery schedule:', error)
    return apiDbError(error, 'Error al actualizar horario de entrega')
  }
}

// DELETE: Eliminar un slot si no tiene pedidos; de lo contrario desactivarlo
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return apiError('Falta el id del horario', 400)
    }

    const referencedOrders = await prisma.order.count({
      where: { deliveryScheduleId: id },
    })

    if (referencedOrders > 0) {
      await prisma.deliverySchedule.update({
        where: { id },
        data: { isActive: false },
      })
    } else {
      await prisma.deliverySchedule.delete({ where: { id } })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting delivery schedule:', error)
    return apiDbError(error, 'Error al eliminar horario de entrega')
  }
}
