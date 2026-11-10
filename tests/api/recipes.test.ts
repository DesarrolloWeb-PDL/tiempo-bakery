import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const recipeFindManyMock = vi.fn()
const recipeFindUniqueMock = vi.fn()
const recipeFindFirstMock = vi.fn()
const recipeCreateMock = vi.fn()
const recipeUpdateMock = vi.fn()
const recipeDeleteMock = vi.fn()
const recipeAggregateMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: {
      findMany: recipeFindManyMock,
      findUnique: recipeFindUniqueMock,
      findFirst: recipeFindFirstMock,
      create: recipeCreateMock,
      update: recipeUpdateMock,
      delete: recipeDeleteMock,
      aggregate: recipeAggregateMock,
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

const listRoutePromise = import('@/app/api/admin/recetas/route')
const idRoutePromise = import('@/app/api/admin/recetas/[id]/route')

function buildJsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: {
      'Content-Type': 'application/json',
      origin: 'http://localhost:3000',
    },
  })
}

describe('GET /api/admin/recetas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna las recetas ordenadas por fecha', async () => {
    recipeFindManyMock.mockResolvedValue([
      { id: 'r1', title: 'Pan integral', slug: 'pan-integral', published: true },
      { id: 'r2', title: 'Tip de hidratación', slug: 'tip-hidratacion', published: false },
    ])

    const { GET } = await listRoutePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.recipes).toHaveLength(2)
    expect(recipeFindManyMock).toHaveBeenCalledWith({
      orderBy: [{ createdAt: 'desc' }],
    })
  })

  it('retorna 500 si la DB falla', async () => {
    recipeFindManyMock.mockRejectedValue(new Error("Can't reach database server"))

    const { GET } = await listRoutePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toContain('Error al obtener las recetas')
  })
})

describe('POST /api/admin/recetas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validPayload = {
    title: 'Pan de masa madre integral',
    summary: 'Pan con harina integral y larga fermentación.',
    content: '1. Mezclar.\n2. Fermentar.\n3. Hornear.',
    ingredients: '500 g de harina\n100 g de masa madre',
    difficulty: 'Media',
    prepTime: 180,
    isTip: false,
    published: true,
  }

  it('crea una receta, genera slug y la retorna 201', async () => {
    recipeFindUniqueMock.mockResolvedValue(null)
    recipeAggregateMock.mockResolvedValue({ _max: { order: 3 } })
    recipeCreateMock.mockResolvedValue({
      id: 'r-new',
      ...validPayload,
      slug: 'pan-de-masa-madre-integral',
      order: 4,
    })

    const { POST } = await listRoutePromise
    const response = await POST(
      buildJsonRequest('http://localhost/api/admin/recetas', 'POST', validPayload)
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.slug).toBe('pan-de-masa-madre-integral')
    expect(recipeCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: validPayload.title,
        slug: 'pan-de-masa-madre-integral',
        order: 4,
        published: true,
        isTip: false,
      }),
    })
  })

  it('retorna 409 si el slug ya existe', async () => {
    recipeFindUniqueMock.mockResolvedValue({ id: 'existente' })

    const { POST } = await listRoutePromise
    const response = await POST(
      buildJsonRequest('http://localhost/api/admin/recetas', 'POST', validPayload)
    )
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toContain('slug')
    expect(recipeCreateMock).not.toHaveBeenCalled()
  })

  it('retorna 400 si falta el resumen', async () => {
    const { POST } = await listRoutePromise
    const response = await POST(
      buildJsonRequest('http://localhost/api/admin/recetas', 'POST', {
        ...validPayload,
        summary: '',
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Datos inválidos')
  })

  it('retorna 400 si falta la preparación', async () => {
    const { POST } = await listRoutePromise
    const response = await POST(
      buildJsonRequest('http://localhost/api/admin/recetas', 'POST', {
        ...validPayload,
        content: '',
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Datos inválidos')
  })
})

describe('PUT /api/admin/recetas/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validUpdate = {
    title: 'Pan actualizado',
    slug: 'pan-actualizado',
    summary: 'Resumen actualizado de la receta.',
    content: '1. Paso uno.\n2. Paso dos.',
    ingredients: null,
    coverImage: null,
    difficulty: 'Fácil',
    prepTime: null,
    isTip: false,
    published: true,
    order: 4,
  }

  it('actualiza una receta existente', async () => {
    recipeFindFirstMock.mockResolvedValue(null)
    recipeUpdateMock.mockResolvedValue({ id: 'r1', ...validUpdate })

    const { PUT } = await idRoutePromise
    const response = await PUT(
      buildJsonRequest('http://localhost/api/admin/recetas/r1', 'PUT', validUpdate),
      { params: { id: 'r1' } }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.id).toBe('r1')
    expect(recipeUpdateMock).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: expect.objectContaining({ title: 'Pan actualizado', published: true }),
    })
  })

  it('retorna 409 si otro registro usa el mismo slug', async () => {
    recipeFindFirstMock.mockResolvedValue({ id: 'r-otra' })

    const { PUT } = await idRoutePromise
    const response = await PUT(
      buildJsonRequest('http://localhost/api/admin/recetas/r1', 'PUT', validUpdate),
      { params: { id: 'r1' } }
    )
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toContain('slug')
    expect(recipeUpdateMock).not.toHaveBeenCalled()
  })

  it('retorna 400 si el título es corto', async () => {
    const { PUT } = await idRoutePromise
    const response = await PUT(
      buildJsonRequest('http://localhost/api/admin/recetas/r1', 'PUT', {
        ...validUpdate,
        title: 'x',
      }),
      { params: { id: 'r1' } }
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Datos inválidos')
  })
})

describe('DELETE /api/admin/recetas/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('elimina una receta', async () => {
    recipeDeleteMock.mockResolvedValue({ id: 'r1' })

    const { DELETE } = await idRoutePromise
    const response = await DELETE(
      buildJsonRequest('http://localhost/api/admin/recetas/r1', 'DELETE'),
      { params: { id: 'r1' } }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(recipeDeleteMock).toHaveBeenCalledWith({ where: { id: 'r1' } })
  })

  it('retorna 500 si la DB falla', async () => {
    recipeDeleteMock.mockRejectedValue(new Error("Can't reach database server"))

    const { DELETE } = await idRoutePromise
    const response = await DELETE(
      buildJsonRequest('http://localhost/api/admin/recetas/r1', 'DELETE'),
      { params: { id: 'r1' } }
    )
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toContain('Error al eliminar')
  })
})

describe('Middleware /api/admin/recetas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isAdminAuthConfiguredMock.mockReturnValue(true)
    hasAdminSessionEdgeMock.mockResolvedValue(true)
    getAdminAuthConfigErrorMock.mockReturnValue('faltan credenciales')
  })

  it('rechaza POST sin headers de origen con 403', async () => {
    const { middleware } = await import('@/middleware')
    const response = await middleware(
      new NextRequest('http://localhost/api/admin/recetas', { method: 'POST' })
    )

    expect(response.status).toBe(403)
  })

  it('rechaza POST sin sesión de admin con 401', async () => {
    hasAdminSessionEdgeMock.mockResolvedValue(false)

    const { middleware } = await import('@/middleware')
    const response = await middleware(
      new NextRequest('http://localhost/api/admin/recetas', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
      })
    )

    expect(response.status).toBe(401)
  })
})