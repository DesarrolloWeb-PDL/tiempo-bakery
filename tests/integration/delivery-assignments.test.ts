import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const orderFindUniqueMock = vi.fn()
const deliveryPersonFindUniqueMock = vi.fn()
const deliveryAssignmentUpsertMock = vi.fn()
const deliveryAssignmentFindUniqueMock = vi.fn()
const deliveryAttemptCreateMock = vi.fn()
const orderUpdateMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: orderFindUniqueMock,
      update: orderUpdateMock,
    },
    deliveryPerson: {
      findUnique: deliveryPersonFindUniqueMock,
    },
    deliveryAssignment: {
      upsert: deliveryAssignmentUpsertMock,
      findUnique: deliveryAssignmentFindUniqueMock,
    },
    deliveryAttempt: {
      create: deliveryAttemptCreateMock,
    },
  },
}))

const assignmentsRoutePromise = import('@/app/api/admin/delivery-assignments/route')
const attemptsRoutePromise = import('@/app/api/admin/delivery-assignments/[orderId]/attempts/route')

function buildAssignmentRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/delivery-assignments', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function buildAttemptRequest(orderId: string, body: unknown) {
  return new NextRequest(`http://localhost/api/admin/delivery-assignments/${orderId}/attempts`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const readyLocalOrder = {
  id: 'ord1',
  orderNumber: 'TBK-0001',
  status: 'READY',
  deliveryMethod: 'LOCAL_DELIVERY',
}

const activePerson = {
  id: 'p1',
  name: 'Ana García',
  phone: '1199998888',
  email: 'ana@example.com',
  isActive: true,
}

describe('POST /api/admin/delivery-assignments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asigna un repartidor al pedido y registra el intento inicial', async () => {
    orderFindUniqueMock.mockResolvedValue(readyLocalOrder)
    deliveryPersonFindUniqueMock.mockResolvedValue(activePerson)
    deliveryAssignmentUpsertMock.mockResolvedValue({
      id: 'as1',
      orderId: 'ord1',
      deliveryPersonId: 'p1',
      status: 'ASSIGNED',
      assignedAt: new Date('2026-09-21T10:00:00Z'),
    })
    deliveryAttemptCreateMock.mockResolvedValue({ id: 'att1' })

    const { POST } = await assignmentsRoutePromise
    const response = await POST(buildAssignmentRequest({ orderId: 'ord1', deliveryPersonId: 'p1' }))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.assignment.orderId).toBe('ord1')
    expect(body.assignment.deliveryPersonId).toBe('p1')
    expect(deliveryAssignmentUpsertMock).toHaveBeenCalledWith({
      where: { orderId: 'ord1' },
      update: {
        deliveryPersonId: 'p1',
        status: 'ASSIGNED',
      },
      create: {
        orderId: 'ord1',
        deliveryPersonId: 'p1',
        status: 'ASSIGNED',
      },
      include: {
        deliveryPerson: {
          select: { id: true, name: true },
        },
      },
    })
    expect(deliveryAttemptCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assignmentId: 'as1',
        deliveryPersonId: 'p1',
        status: 'ASSIGNED',
        success: true,
      }),
    })
  })

  it('re-asigna el mismo pedido sin duplicar filas (upsert)', async () => {
    orderFindUniqueMock.mockResolvedValue(readyLocalOrder)
    deliveryPersonFindUniqueMock.mockResolvedValue(activePerson)
    deliveryAssignmentUpsertMock.mockResolvedValue({
      id: 'as1',
      orderId: 'ord1',
      deliveryPersonId: 'p2',
      status: 'ASSIGNED',
      assignedAt: new Date('2026-09-21T10:00:00Z'),
    })
    deliveryAttemptCreateMock.mockResolvedValue({ id: 'att2' })

    const { POST } = await assignmentsRoutePromise
    const response = await POST(buildAssignmentRequest({ orderId: 'ord1', deliveryPersonId: 'p2' }))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.assignment.deliveryPersonId).toBe('p2')
    expect(deliveryAssignmentUpsertMock).toHaveBeenCalledTimes(1)
    expect(deliveryAssignmentUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orderId: 'ord1' } })
    )
  })

  it('retorna 400 si el pedido no usa envío local', async () => {
    orderFindUniqueMock.mockResolvedValue({
      ...readyLocalOrder,
      deliveryMethod: 'PICKUP_POINT',
    })

    const { POST } = await assignmentsRoutePromise
    const response = await POST(buildAssignmentRequest({ orderId: 'ord1', deliveryPersonId: 'p1' }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('envío local')
    expect(deliveryAssignmentUpsertMock).not.toHaveBeenCalled()
  })

  it('retorna 400 si el pedido no está en estado READY', async () => {
    orderFindUniqueMock.mockResolvedValue({
      ...readyLocalOrder,
      status: 'PAID',
    })

    const { POST } = await assignmentsRoutePromise
    const response = await POST(buildAssignmentRequest({ orderId: 'ord1', deliveryPersonId: 'p1' }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('READY')
    expect(deliveryAssignmentUpsertMock).not.toHaveBeenCalled()
  })

  it('retorna 400 si el repartidor no está activo', async () => {
    orderFindUniqueMock.mockResolvedValue(readyLocalOrder)
    deliveryPersonFindUniqueMock.mockResolvedValue({ ...activePerson, isActive: false })

    const { POST } = await assignmentsRoutePromise
    const response = await POST(buildAssignmentRequest({ orderId: 'ord1', deliveryPersonId: 'p1' }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('activo')
    expect(deliveryAssignmentUpsertMock).not.toHaveBeenCalled()
  })

  it('retorna 400 si falta orderId o deliveryPersonId', async () => {
    const { POST } = await assignmentsRoutePromise

    const missingOrder = await POST(buildAssignmentRequest({ deliveryPersonId: 'p1' }))
    expect(missingOrder.status).toBe(400)

    const missingPerson = await POST(buildAssignmentRequest({ orderId: 'ord1' }))
    expect(missingPerson.status).toBe(400)
  })

  it('retorna 404 si el pedido no existe', async () => {
    orderFindUniqueMock.mockResolvedValue(null)

    const { POST } = await assignmentsRoutePromise
    const response = await POST(buildAssignmentRequest({ orderId: 'ord1', deliveryPersonId: 'p1' }))

    expect(response.status).toBe(404)
  })
})

describe('POST /api/admin/delivery-assignments/[orderId]/attempts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registra un intento de entrega sin cambiar el estado del pedido', async () => {
    deliveryAssignmentFindUniqueMock.mockResolvedValue({
      id: 'as1',
      orderId: 'ord1',
      deliveryPersonId: 'p1',
      status: 'OUT_FOR_DELIVERY',
    })
    deliveryAttemptCreateMock.mockResolvedValue({
      id: 'att3',
      assignmentId: 'as1',
      status: 'DELIVERY_FAILED',
      success: false,
      reason: 'No contestó',
    })

    const { POST } = await attemptsRoutePromise
    const response = await POST(
      buildAttemptRequest('ord1', { status: 'DELIVERY_FAILED', success: false, reason: 'No contestó' }),
      { params: { orderId: 'ord1' } }
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.attempt.success).toBe(false)
    expect(body.attempt.reason).toBe('No contestó')
    expect(deliveryAttemptCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assignmentId: 'as1',
        deliveryPersonId: 'p1',
        status: 'DELIVERY_FAILED',
        success: false,
        reason: 'No contestó',
      }),
    })
    expect(orderUpdateMock).not.toHaveBeenCalled()
  })

  it('retorna 404 si no hay asignación para el pedido', async () => {
    deliveryAssignmentFindUniqueMock.mockResolvedValue(null)

    const { POST } = await attemptsRoutePromise
    const response = await POST(
      buildAttemptRequest('ord1', { status: 'DELIVERY_FAILED', success: false }),
      { params: { orderId: 'ord1' } }
    )

    expect(response.status).toBe(404)
    expect(deliveryAttemptCreateMock).not.toHaveBeenCalled()
  })
})
