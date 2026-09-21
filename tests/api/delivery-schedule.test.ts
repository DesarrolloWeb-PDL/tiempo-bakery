import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const scheduleFindManyMock = vi.fn()
const scheduleCreateMock = vi.fn()
const scheduleUpdateMock = vi.fn()
const scheduleDeleteMock = vi.fn()
const scheduleFindUniqueMock = vi.fn()
const scheduleCountMock = vi.fn()
const orderCountMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    deliverySchedule: {
      findMany: scheduleFindManyMock,
      create: scheduleCreateMock,
      update: scheduleUpdateMock,
      delete: scheduleDeleteMock,
      findUnique: scheduleFindUniqueMock,
      count: scheduleCountMock,
    },
    order: {
      count: orderCountMock,
    },
  },
}))

const isAdminAuthConfiguredMock = vi.fn()
const hasAdminSessionEdgeMock = vi.fn()
const getAdminAuthConfigErrorMock = vi.fn()

vi.mock('@/lib/admin-auth-edge', () => ({
  isAdminAuthConfigured: isAdminAuthConfiguredMock,
  hasAdminSessionEdge: hasAdminSessionEdgeMock,
  getAdminAuthConfigError: getAdminAuthConfigErrorMock,
}))

const routeModulePromise = import('@/app/api/admin/delivery-schedule/route')

function buildJsonRequest(method: string, body: unknown) {
  return new NextRequest('http://localhost/api/admin/delivery-schedule', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/admin/delivery-schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna slots ordenados por día de la semana', async () => {
    scheduleFindManyMock.mockResolvedValue([
      {
        id: 's2',
        dayOfWeek: 6,
        startTime: '10:00',
        endTime: '14:00',
        maxOrders: 8,
        cutoffDay: null,
        cutoffTime: null,
        isActive: true,
      },
      {
        id: 's1',
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '14:00',
        maxOrders: 10,
        cutoffDay: 3,
        cutoffTime: '18:00',
        isActive: true,
      },
    ])

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.schedules).toHaveLength(2)
    expect(scheduleFindManyMock).toHaveBeenCalledWith({ orderBy: { dayOfWeek: 'asc' } })
    expect(body.schedules[0].dayOfWeek).toBe(5)
    expect(body.schedules[1].dayOfWeek).toBe(6)
  })

  it('retorna 500 si la DB falla', async () => {
    scheduleFindManyMock.mockRejectedValue(new Error("Can't reach database server"))

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toContain('base de datos')
  })
})

describe('POST /api/admin/delivery-schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crea un slot válido y lo retorna', async () => {
    const payload = {
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '14:00',
      maxOrders: 10,
      cutoffDay: 3,
      cutoffTime: '18:00',
      isActive: true,
    }
    scheduleCountMock.mockResolvedValue(0)
    scheduleCreateMock.mockResolvedValue({ id: 'new', ...payload })

    const { POST } = await routeModulePromise
    const response = await POST(buildJsonRequest('POST', payload))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.schedule.id).toBe('new')
    expect(body.schedule.dayOfWeek).toBe(5)
    expect(scheduleCountMock).toHaveBeenCalledWith({
      where: { isActive: true, dayOfWeek: 5 },
    })
  })

  it('retorna 409 si ya existe un slot activo para ese día', async () => {
    const payload = {
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '14:00',
      isActive: true,
    }
    scheduleCountMock.mockResolvedValue(1)

    const { POST } = await routeModulePromise
    const response = await POST(buildJsonRequest('POST', payload))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toContain('activo')
    expect(scheduleCreateMock).not.toHaveBeenCalled()
  })

  it('retorna 400 si endTime es menor o igual a startTime', async () => {
    const payload = {
      dayOfWeek: 5,
      startTime: '14:00',
      endTime: '09:00',
      isActive: true,
    }

    const { POST } = await routeModulePromise
    const response = await POST(buildJsonRequest('POST', payload))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Datos inválidos')
  })

  it('retorna 400 si cutoffDay está presente pero cutoffTime no', async () => {
    const payload = {
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '14:00',
      cutoffDay: 3,
      isActive: true,
    }

    const { POST } = await routeModulePromise
    const response = await POST(buildJsonRequest('POST', payload))
    const body = await response.json()

    expect(response.status).toBe(400)
  })
})

describe('PUT /api/admin/delivery-schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('actualiza un slot existente', async () => {
    const payload = {
      id: 's1',
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '16:00',
      maxOrders: 15,
      isActive: true,
    }
    scheduleCountMock.mockResolvedValue(0)
    scheduleUpdateMock.mockResolvedValue({ ...payload })

    const { PUT } = await routeModulePromise
    const response = await PUT(buildJsonRequest('PUT', payload))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.schedule.endTime).toBe('16:00')
    expect(scheduleUpdateMock).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: {
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '16:00',
        maxOrders: 15,
        isActive: true,
      },
    })
  })

  it('retorna 400 si falta el id', async () => {
    const { PUT } = await routeModulePromise
    const response = await PUT(
      buildJsonRequest('PUT', {
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '14:00',
        isActive: true,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('id')
  })

  it('retorna 409 si el nuevo día ya tiene un slot activo distinto', async () => {
    const payload = {
      id: 's1',
      dayOfWeek: 6,
      startTime: '09:00',
      endTime: '14:00',
      isActive: true,
    }
    scheduleCountMock.mockResolvedValue(1)

    const { PUT } = await routeModulePromise
    const response = await PUT(buildJsonRequest('PUT', payload))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(scheduleUpdateMock).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/admin/delivery-schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('elimina un slot sin pedidos referenciados', async () => {
    orderCountMock.mockResolvedValue(0)
    scheduleDeleteMock.mockResolvedValue({ id: 's1' })

    const { DELETE } = await routeModulePromise
    const response = await DELETE(buildJsonRequest('DELETE', { id: 's1' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(scheduleDeleteMock).toHaveBeenCalledWith({ where: { id: 's1' } })
    expect(scheduleUpdateMock).not.toHaveBeenCalled()
  })

  it('desactiva un slot con pedidos referenciados', async () => {
    orderCountMock.mockResolvedValue(3)
    scheduleUpdateMock.mockResolvedValue({ id: 's1', isActive: false })

    const { DELETE } = await routeModulePromise
    const response = await DELETE(buildJsonRequest('DELETE', { id: 's1' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(scheduleUpdateMock).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isActive: false },
    })
    expect(scheduleDeleteMock).not.toHaveBeenCalled()
  })

  it('retorna 400 si falta el id', async () => {
    const { DELETE } = await routeModulePromise
    const response = await DELETE(buildJsonRequest('DELETE', {}))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('id')
  })
})

describe('Middleware /api/admin/delivery-schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isAdminAuthConfiguredMock.mockReturnValue(true)
    hasAdminSessionEdgeMock.mockResolvedValue(true)
    getAdminAuthConfigErrorMock.mockReturnValue('faltan credenciales')
  })

  it('rechaza POST sin headers de origen con 403', async () => {
    const { middleware } = await import('@/middleware')
    const response = await middleware(
      new NextRequest('http://localhost/api/admin/delivery-schedule', {
        method: 'POST',
      })
    )

    expect(response.status).toBe(403)
  })

  it('rechaza POST sin sesión de admin con 401', async () => {
    hasAdminSessionEdgeMock.mockResolvedValue(false)

    const { middleware } = await import('@/middleware')
    const response = await middleware(
      new NextRequest('http://localhost/api/admin/delivery-schedule', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
      })
    )

    expect(response.status).toBe(401)
  })
})
