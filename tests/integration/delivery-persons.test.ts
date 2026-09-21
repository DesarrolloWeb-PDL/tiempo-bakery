import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const personFindManyMock = vi.fn()
const personCreateMock = vi.fn()
const personUpdateMock = vi.fn()
const personDeleteMock = vi.fn()
const personFindUniqueMock = vi.fn()
const assignmentCountMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    deliveryPerson: {
      findMany: personFindManyMock,
      create: personCreateMock,
      update: personUpdateMock,
      delete: personDeleteMock,
      findUnique: personFindUniqueMock,
    },
    deliveryAssignment: {
      count: assignmentCountMock,
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

const routeModulePromise = import('@/app/api/admin/delivery-persons/route')

function buildJsonRequest(method: string, body: unknown) {
  return new NextRequest('http://localhost/api/admin/delivery-persons', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/admin/delivery-persons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna lista de repartidores ordenada por nombre', async () => {
    personFindManyMock.mockResolvedValue([
      {
        id: 'p2',
        name: 'Carlos López',
        phone: '1155556666',
        email: 'carlos@example.com',
        isActive: true,
      },
      {
        id: 'p1',
        name: 'Ana García',
        phone: '1199998888',
        email: null,
        isActive: false,
      },
    ])

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.persons).toHaveLength(2)
    expect(personFindManyMock).toHaveBeenCalledWith({ orderBy: { name: 'asc' } })
    const ana = body.persons.find((p: { id: string }) => p.id === 'p1')
    expect(ana?.name).toBe('Ana García')
  })

  it('retorna 500 si la DB falla', async () => {
    personFindManyMock.mockRejectedValue(new Error("Can't reach database server"))

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toContain('base de datos')
  })
})

describe('POST /api/admin/delivery-persons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crea un repartidor válido y lo retorna', async () => {
    const payload = {
      name: 'Ana García',
      phone: '1199998888',
      email: 'ana@example.com',
      isActive: true,
    }
    personCreateMock.mockResolvedValue({ id: 'new', ...payload })

    const { POST } = await routeModulePromise
    const response = await POST(buildJsonRequest('POST', payload))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.person.id).toBe('new')
    expect(body.person.name).toBe('Ana García')
    expect(personCreateMock).toHaveBeenCalledWith({ data: payload })
  })

  it('retorna 400 si el email es inválido', async () => {
    const { POST } = await routeModulePromise
    const response = await POST(
      buildJsonRequest('POST', {
        name: 'Ana García',
        phone: '1199998888',
        email: 'no-es-un-email',
        isActive: true,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Datos inválidos')
    expect(personCreateMock).not.toHaveBeenCalled()
  })

  it('retorna 400 si falta el nombre', async () => {
    const { POST } = await routeModulePromise
    const response = await POST(
      buildJsonRequest('POST', {
        phone: '1199998888',
        isActive: true,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Datos inválidos')
  })
})

describe('PUT /api/admin/delivery-persons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('actualiza un repartidor existente', async () => {
    const payload = {
      id: 'p1',
      name: 'Ana García Actualizada',
      phone: '1199998888',
      email: 'ana@example.com',
      isActive: true,
    }
    personUpdateMock.mockResolvedValue({ ...payload })

    const { PUT } = await routeModulePromise
    const response = await PUT(buildJsonRequest('PUT', payload))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.person.name).toBe('Ana García Actualizada')
    expect(personUpdateMock).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: {
        name: 'Ana García Actualizada',
        phone: '1199998888',
        email: 'ana@example.com',
        isActive: true,
      },
    })
  })

  it('retorna 400 si falta el id', async () => {
    const { PUT } = await routeModulePromise
    const response = await PUT(
      buildJsonRequest('PUT', {
        name: 'Ana García',
        phone: '1199998888',
        isActive: true,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('id')
  })
})

describe('DELETE /api/admin/delivery-persons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('elimina un repartidor sin historial de asignaciones', async () => {
    assignmentCountMock.mockResolvedValue(0)
    personDeleteMock.mockResolvedValue({ id: 'p1' })

    const { DELETE } = await routeModulePromise
    const response = await DELETE(buildJsonRequest('DELETE', { id: 'p1' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(assignmentCountMock).toHaveBeenCalledWith({
      where: { deliveryPersonId: 'p1' },
    })
    expect(personDeleteMock).toHaveBeenCalledWith({ where: { id: 'p1' } })
    expect(personUpdateMock).not.toHaveBeenCalled()
  })

  it('retorna 409 si el repartidor tiene historial de asignaciones', async () => {
    assignmentCountMock.mockResolvedValue(2)

    const { DELETE } = await routeModulePromise
    const response = await DELETE(buildJsonRequest('DELETE', { id: 'p1' }))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toContain('historial')
    expect(personDeleteMock).not.toHaveBeenCalled()
  })

  it('retorna 400 si falta el id', async () => {
    const { DELETE } = await routeModulePromise
    const response = await DELETE(buildJsonRequest('DELETE', {}))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('id')
  })
})

describe('Middleware /api/admin/delivery-persons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isAdminAuthConfiguredMock.mockReturnValue(true)
    hasAdminSessionEdgeMock.mockResolvedValue(true)
    getAdminAuthConfigErrorMock.mockReturnValue('faltan credenciales')
  })

  it('rechaza POST sin headers de origen con 403', async () => {
    const { middleware } = await import('@/middleware')
    const response = await middleware(
      new NextRequest('http://localhost/api/admin/delivery-persons', {
        method: 'POST',
      })
    )

    expect(response.status).toBe(403)
  })

  it('rechaza POST sin sesión de admin con 401', async () => {
    hasAdminSessionEdgeMock.mockResolvedValue(false)

    const { middleware } = await import('@/middleware')
    const response = await middleware(
      new NextRequest('http://localhost/api/admin/delivery-persons', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
      })
    )

    expect(response.status).toBe(401)
  })
})
