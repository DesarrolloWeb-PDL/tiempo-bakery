import { beforeEach, describe, expect, it, vi } from 'vitest'

const productFindManyMock = vi.fn()
const categoryFindManyMock = vi.fn()
const productUpdateMock = vi.fn()
const productImageCreateMock = vi.fn()
const $transactionMock = vi.fn()
const getCurrentWeekIdMock = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    product: {
      findMany: productFindManyMock,
      update: productUpdateMock,
    },
    category: {
      findMany: categoryFindManyMock,
    },
    productImage: {
      create: productImageCreateMock,
    },
    $transaction: $transactionMock,
  },
}))

vi.mock('@/lib/time-gating', () => ({
  timeGating: {
    getCurrentWeekId: getCurrentWeekIdMock,
  },
}))

vi.mock('@/lib/url-normalizer', () => ({
  normalizePublicAssetUrl: (url: string) => url,
}))

vi.mock('@/lib/product-images', () => ({
  syncProductImageGallery: vi.fn(),
}))

const sampleProduct = {
  id: 'prod_1',
  name: 'Pan de campo',
  slug: 'pan-de-campo',
  description: 'Pan artesanal',
  price: 5000,
  weight: 500,
  imageUrl: '/img/pan.jpg',
  imageAlt: 'Pan de campo',
  allergens: '["gluten"]',
  stockType: 'WEEKLY',
  weeklyStock: 20,
  isActive: true,
  allowSlicing: true,
  riskNote: null,
  category: { id: 'cat_1', name: 'Panes', slug: 'panes' },
  _count: { orderItems: 5, images: 2 },
  images: [
    { id: 'img_1', url: '/img/pan.jpg', altText: 'Pan de campo', order: 0 },
  ],
  weeklyStocks: [
    { weekId: '2026-W32', maxStock: 20, currentStock: 15, reservedStock: 2 },
  ],
}

const sampleCategory = { id: 'cat_1', name: 'Panes', slug: 'panes' }

const routeModulePromise = import('@/app/api/admin/productos/route')

describe('GET /api/admin/productos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCurrentWeekIdMock.mockReturnValue('2026-W32')
    $transactionMock.mockImplementation(async (fns: unknown[]) => {
      if (Array.isArray(fns)) {
        return Promise.all(fns)
      }
      return fns
    })
  })

  it('retorna productos y categorías', async () => {
    productFindManyMock.mockResolvedValue([sampleProduct])
    categoryFindManyMock.mockResolvedValue([sampleCategory])

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.products).toHaveLength(1)
    expect(body.categories).toHaveLength(1)
    expect(body.products[0].name).toBe('Pan de campo')
    expect(body.categories[0].name).toBe('Panes')
  })

  it('normaliza allergens de JSON string a array', async () => {
    productFindManyMock.mockResolvedValue([sampleProduct])
    categoryFindManyMock.mockResolvedValue([sampleCategory])

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(Array.isArray(body.products[0].allergens)).toBe(true)
    expect(body.products[0].allergens).toEqual(['gluten'])
  })

  it('calcula currentWeekStock para stock semanal', async () => {
    productFindManyMock.mockResolvedValue([sampleProduct])
    categoryFindManyMock.mockResolvedValue([sampleCategory])

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    const stock = body.products[0].currentWeekStock
    expect(stock).not.toBeNull()
    expect(stock.weekId).toBe('2026-W32')
    expect(stock.available).toBe(13) // 15 - 2
    expect(stock.sold).toBe(3) // 20 - 15 - 2
  })

  it('retorna currentWeekStock null para stock UNLIMITED', async () => {
    productFindManyMock.mockResolvedValue([
      { ...sampleProduct, stockType: 'UNLIMITED', weeklyStocks: [] },
    ])
    categoryFindManyMock.mockResolvedValue([sampleCategory])

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(body.products[0].currentWeekStock).toBeNull()
  })

  it('retorna 500 si la DB falla', async () => {
    productFindManyMock.mockRejectedValue(new Error('Can\'t reach database server'))

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toContain('base de datos')
  })

  it('retorna productos con imágenes', async () => {
    productFindManyMock.mockResolvedValue([sampleProduct])
    categoryFindManyMock.mockResolvedValue([sampleCategory])

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(body.products[0].images).toHaveLength(1)
    expect(body.products[0].images[0].url).toBe('/img/pan.jpg')
  })

  it('retorna conteos de orderItems e images', async () => {
    productFindManyMock.mockResolvedValue([sampleProduct])
    categoryFindManyMock.mockResolvedValue([sampleCategory])

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(body.products[0]._count.orderItems).toBe(5)
    expect(body.products[0]._count.images).toBe(2)
  })
})
