import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const orderFindUniqueMock = vi.fn()
const orderUpdateMock = vi.fn()
const deliveryAssignmentFindFirstMock = vi.fn()
const deliveryAssignmentUpdateMock = vi.fn()
const $transactionMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: orderFindUniqueMock,
      update: orderUpdateMock,
    },
    deliveryAssignment: {
      findFirst: deliveryAssignmentFindFirstMock,
      findUnique: deliveryAssignmentFindFirstMock,
      update: deliveryAssignmentUpdateMock,
    },
    $transaction: $transactionMock,
  },
}))

const routeModulePromise = import('@/app/api/admin/pedidos/[id]/route')

function buildPatchRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/admin/pedidos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

async function patchStatus(id: string, body: unknown) {
  const { PATCH } = await routeModulePromise
  return PATCH(buildPatchRequest(id, body), { params: { id } })
}

const baseOrder = {
  id: 'ord1',
  orderNumber: 'TBK-0001',
  status: 'READY',
  deliveryMethod: 'LOCAL_DELIVERY',
  paymentStatus: 'PAID',
  deliveredAt: null,
}

describe('PATCH /api/admin/pedidos/[id] — status guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    $transactionMock.mockImplementation(async (ops: unknown[]) => Promise.all(ops))
  })

  it('permite READY → OUT_FOR_DELIVERY con asignación activa', async () => {
    orderFindUniqueMock.mockResolvedValue(baseOrder)
    deliveryAssignmentFindFirstMock.mockResolvedValue({
      id: 'as1',
      orderId: 'ord1',
      deliveryPersonId: 'p1',
      status: 'ASSIGNED',
    })
    orderUpdateMock.mockResolvedValue({ ...baseOrder, status: 'OUT_FOR_DELIVERY' })

    const response = await patchStatus('ord1', { status: 'OUT_FOR_DELIVERY' })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('OUT_FOR_DELIVERY')
  })

  it('rechaza READY → OUT_FOR_DELIVERY si no hay asignación activa', async () => {
    orderFindUniqueMock.mockResolvedValue(baseOrder)
    deliveryAssignmentFindFirstMock.mockResolvedValue(null)

    const response = await patchStatus('ord1', { status: 'OUT_FOR_DELIVERY' })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('asignación')
    expect(orderUpdateMock).not.toHaveBeenCalled()
  })

  it('rechaza OUT_FOR_DELIVERY → DELIVERY_FAILED sin motivo', async () => {
    orderFindUniqueMock.mockResolvedValue({
      ...baseOrder,
      status: 'OUT_FOR_DELIVERY',
    })

    const response = await patchStatus('ord1', { status: 'DELIVERY_FAILED' })
    const body = await response.json()

    expect(response.status).toBe(400)
    const reasonMessage = body.details?.fieldErrors?.failedReason?.[0] ?? body.error
    expect(reasonMessage).toContain('motivo')
    expect(orderUpdateMock).not.toHaveBeenCalled()
  })

  it('permite OUT_FOR_DELIVERY → DELIVERY_FAILED con motivo', async () => {
    orderFindUniqueMock.mockResolvedValue({
      ...baseOrder,
      status: 'OUT_FOR_DELIVERY',
    })
    orderUpdateMock.mockResolvedValue({
      ...baseOrder,
      status: 'DELIVERY_FAILED',
      failedReason: 'No contestó',
    })

    const response = await patchStatus('ord1', { status: 'DELIVERY_FAILED', failedReason: 'No contestó' })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('DELIVERY_FAILED')
  })

  it('setea deliveredAt en Order y DeliveryAssignment al pasar a DELIVERED', async () => {
    orderFindUniqueMock.mockResolvedValue({
      ...baseOrder,
      status: 'OUT_FOR_DELIVERY',
    })
    deliveryAssignmentFindFirstMock.mockResolvedValue({
      id: 'as1',
      orderId: 'ord1',
      deliveryPersonId: 'p1',
      status: 'OUT_FOR_DELIVERY',
    })
    orderUpdateMock.mockResolvedValue({
      ...baseOrder,
      status: 'DELIVERED',
      deliveredAt: new Date('2026-09-21T12:00:00Z'),
    })

    const response = await patchStatus('ord1', { status: 'DELIVERED' })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('DELIVERED')
    expect(body.deliveredAt).toBeDefined()

    const txCalls = $transactionMock.mock.calls[0]?.[0] ?? []
    expect(txCalls).toHaveLength(2)
    expect(orderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord1' },
        data: expect.objectContaining({ status: 'DELIVERED', deliveredAt: expect.any(Date) }),
      })
    )
    expect(deliveryAssignmentUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'as1' },
        data: expect.objectContaining({ deliveredAt: expect.any(Date) }),
      })
    )
  })

  it('rechaza transiciones inválidas según el método de entrega', async () => {
    orderFindUniqueMock.mockResolvedValue({
      ...baseOrder,
      deliveryMethod: 'PICKUP_POINT',
    })

    const response = await patchStatus('ord1', { status: 'OUT_FOR_DELIVERY' })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Transición')
    expect(orderUpdateMock).not.toHaveBeenCalled()
  })

  it('rechaza un estado desconocido', async () => {
    orderFindUniqueMock.mockResolvedValue(baseOrder)

    const response = await patchStatus('ord1', { status: 'INVALID_STATUS' })

    expect(response.status).toBe(400)
    expect(orderUpdateMock).not.toHaveBeenCalled()
  })
})
