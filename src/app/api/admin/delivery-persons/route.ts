import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deliveryPersonSchema } from '@/types/delivery'
import { apiError, apiDbError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

// GET: Listar todos los repartidores ordenados por nombre
export async function GET() {
  try {
    const persons = await prisma.deliveryPerson.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ persons })
  } catch (error) {
    console.error('Error fetching delivery persons:', error)
    return apiDbError(error, 'Error al obtener repartidores')
  }
}

// POST: Crear un nuevo repartidor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = deliveryPersonSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const person = await prisma.deliveryPerson.create({ data: parsed.data })
    return NextResponse.json({ person }, { status: 201 })
  } catch (error) {
    console.error('Error creating delivery person:', error)
    return apiDbError(error, 'Error al crear repartidor')
  }
}

// PUT: Actualizar un repartidor existente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body

    if (!id || typeof id !== 'string') {
      return apiError('Falta el id del repartidor', 400)
    }

    const parsed = deliveryPersonSchema.safeParse(rest)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const person = await prisma.deliveryPerson.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ person })
  } catch (error) {
    console.error('Error updating delivery person:', error)
    return apiDbError(error, 'Error al actualizar repartidor')
  }
}

// DELETE: Eliminar un repartidor solo si no tiene asignaciones históricas
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return apiError('Falta el id del repartidor', 400)
    }

    const assignedOrders = await prisma.deliveryAssignment.count({
      where: { deliveryPersonId: id },
    })

    if (assignedOrders > 0) {
      return apiError(
        'No se puede eliminar un repartidor con historial de asignaciones',
        409
      )
    }

    await prisma.deliveryPerson.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting delivery person:', error)
    return apiDbError(error, 'Error al eliminar repartidor')
  }
}
