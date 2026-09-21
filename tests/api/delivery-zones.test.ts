import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const zoneFindManyMock = vi.fn()
const zoneCreateMock = vi.fn()
const zoneUpdateMock = vi.fn()
const zoneDeleteMock = vi.fn()
const zoneFindUniqueMock = vi.fn()
const orderCountMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    deliveryZone: {
      findMany: zoneFindManyMock,
      create: zoneCreateMock,
      update: zoneUpdateMock,
      delete: zoneDeleteMock,
      findUnique: zoneFindUniqueMock,
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

const routeModulePromise = import('@/app/api/admin/delivery-zones/route')

function buildJsonRequest(method: string, body: unknown) {
  return new NextRequest('http://localhost/api/admin/delivery-zones', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/admin/delivery-zones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna zonas ordenadas por order', async () => {
    zoneFindManyMock.mockResolvedValue([
      {
        id: 'z2',
        name: 'Norte',
        neighborhoods: ['Alameda'],
        shippingCost: 3000,
        isActive: true,
        order: 2,
      },
      {
        id: 'z1',
        name: 'Centro',
        neighborhoods: ['Palermo', 'Belgrano'],
        shippingCost: 2500,
        isActive: true,
        order: 1,
      },
    ])

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.zones).toHaveLength(2)
    expect(zoneFindManyMock).toHaveBeenCalledWith({ orderBy: { order: 'asc' } })
    const norte = body.zones.find((z: { id: string }) => z.id === 'z2')
    expect(norte?.neighborhoods).toEqual(['Alameda'])
  })

  it('retorna 500 si la DB falla', async () => {
    zoneFindManyMock.mockRejectedValue(new Error("Can't reach database server"))

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toContain('base de datos')
  })
})

describe('POST /api/admin/delivery-zones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crea una zona válida y la retorna', async () => {
    const payload = {
      name: 'Centro',
      neighborhoods: ['Palermo', 'Belgrano'],
      shippingCost: 2500,
      isActive: true,
      order: 1,
    }
    zoneCreateMock.mockResolvedValue({ id: 'new', ...payload })

    const { POST } = await routeModulePromise
    const response = await POST(buildJsonRequest('POST', payload))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.zone.id).toBe('new')
    expect(body.zone.name).toBe('Centro')
    expect(zoneCreateMock).toHaveBeenCalledWith({ data: payload })
  })

  it('retorna 400 si faltan barrios', async () => {
    const { POST } = await routeModulePromise
    const response = await POST(
      buildJsonRequest('POST', {
        name: 'Centro',
        neighborhoods: [],
        shippingCost: 2500,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Datos inválidos')
  })

  it('retorna 400 si el costo de envío es negativo', async () => {
    const { POST } = await routeModulePromise
    const response = await POST(
      buildJsonRequest('POST', {
        name: 'Centro',
        neighborhoods: ['Palermo'],
        shippingCost: -100,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Datos inválidos')
  })

  it('retorna 400 si el nombre está vacío', async () => {
    const { POST } = await routeModulePromise
    const response = await POST(
      buildJsonRequest('POST', {
        name: '',
        neighborhoods: ['Palermo'],
        shippingCost: 2500,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Datos inválidos')
  })
})

describe('PUT /api/admin/delivery-zones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('actualiza una zona existente', async () => {
    const payload = {
      id: 'z1',
      name: 'Centro Actualizado',
      neighborhoods: ['Palermo'],
      shippingCost: 2600,
      isActive: true,
      order: 1,
    }
    zoneUpdateMock.mockResolvedValue({ ...payload })

    const { PUT } = await routeModulePromise
    const response = await PUT(buildJsonRequest('PUT', payload))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.zone.name).toBe('Centro Actualizado')
    expect(zoneUpdateMock).toHaveBeenCalledWith({
      where: { id: 'z1' },
      data: {
        name: 'Centro Actualizado',
        neighborhoods: ['Palermo'],
        shippingCost: 2600,
        isActive: true,
        order: 1,
      },
    })
  })

  it('retorna 400 si falta el id', async () => {
    const { PUT } = await routeModulePromise
    const response = await PUT(
      buildJsonRequest('PUT', {
        name: 'Centro',
        neighborhoods: ['Palermo'],
        shippingCost: 2500,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('id')
  })
})

describe('DELETE /api/admin/delivery-zones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('elimina una zona sin pedidos referenciados', async () => {
    orderCountMock.mockResolvedValue(0)
    zoneDeleteMock.mockResolvedValue({ id: 'z1' })

    const { DELETE } = await routeModulePromise
    const response = await DELETE(buildJsonRequest('DELETE', { id: 'z1' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(zoneDeleteMock).toHaveBeenCalledWith({ where: { id: 'z1' } })
    expect(zoneUpdateMock).not.toHaveBeenCalled()
  })

  it('desactiva una zona con pedidos referenciados', async () => {
    orderCountMock.mockResolvedValue(3)
    zoneUpdateMock.mockResolvedValue({ id: 'z1', isActive: false })

    const { DELETE } = await routeModulePromise
    const response = await DELETE(buildJsonRequest('DELETE', { id: 'z1' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(zoneUpdateMock).toHaveBeenCalledWith({
      where: { id: 'z1' },
      data: { isActive: false },
    })
    expect(zoneDeleteMock).not.toHaveBeenCalled()
  })

  it('retorna 400 si falta el id', async () => {
    const { DELETE } = await routeModulePromise
    const response = await DELETE(buildJsonRequest('DELETE', {}))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('id')
  })
})

describe('Middleware /api/admin/delivery-zones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isAdminAuthConfiguredMock.mockReturnValue(true)
    hasAdminSessionEdgeMock.mockResolvedValue(true)
    getAdminAuthConfigErrorMock.mockReturnValue('faltan credenciales')
  })

  it('rechaza POST sin headers de origen con 403', async () => {
    const { middleware } = await import('@/middleware')
    const response = await middleware(
      new NextRequest('http://localhost/api/admin/delivery-zones', {
        method: 'POST',
      })
    )

    expect(response.status).toBe(403)
  })

  it('rechaza POST sin sesión de admin con 401', async () => {
    hasAdminSessionEdgeMock.mockResolvedValue(false)

    const { middleware } = await import('@/middleware')
    const response = await middleware(
      new NextRequest('http://localhost/api/admin/delivery-zones', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
      })
    )

    expect(response.status).toBe(401)
  })
})
