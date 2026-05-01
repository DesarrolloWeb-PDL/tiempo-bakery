import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { timeGating } from '@/lib/time-gating'
import { AddToCartButton } from '@/components/productos/add-to-cart-button'
import { ProductGallery } from '@/components/productos/product-gallery'

export const dynamic = 'force-dynamic'

function normalizeImageUrl(value: string) {
  if (!value) return '/img/espiga.png'
  try {
    const parsed = new URL(value)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return parsed.pathname + parsed.search
    }
    return value
  } catch {
    return value
  }
}

export default async function ProductoDetallePage({ params }: { params: { slug: string } }) {
  const weekId = timeGating.getCurrentWeekId()

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        select: {
          id: true,
          url: true,
          altText: true,
          order: true,
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      },
      weeklyStocks: {
        where: { weekId },
        select: {
          maxStock: true,
          currentStock: true,
          reservedStock: true,
        },
      },
    },
  })

  if (!product || !product.isActive || !product.published) {
    notFound()
  }

  const stockInfo = product.weeklyStocks[0]
  const availableStock = product.stockType === 'UNLIMITED'
    ? Number.MAX_SAFE_INTEGER
    : stockInfo
      ? Math.max(0, stockInfo.currentStock - stockInfo.reservedStock)
      : product.weeklyStock

  let allergens: string[] = []
  try {
    allergens = JSON.parse(product.allergens || '[]')
  } catch {
    allergens = []
  }

  const galleryImages = (product.images.length > 0 ? product.images : [{
    id: `${product.id}-primary`,
    url: product.imageUrl,
    altText: product.imageAlt,
    order: 0,
  }]).map((image) => ({
    id: image.id,
    url: normalizeImageUrl(image.url),
    altText: image.altText || product.imageAlt || product.name,
  }))

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductGallery images={galleryImages} productName={product.name} />

        <div className="space-y-4">
          <p className="text-sm text-amber-700 font-medium">{product.category.name}</p>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>
          <p className="text-2xl font-bold text-amber-700">
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price)}
          </p>

          {product.weight && <p className="text-sm text-gray-500">Peso: {product.weight}g</p>}

          {allergens.length > 0 && (
            <p className="text-sm text-gray-600">Alérgenos: {allergens.join(', ')}</p>
          )}

          {product.riskNote && (
            <p className="text-sm text-red-700">{product.riskNote}</p>
          )}

          <div className="pt-2">
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              price={product.price}
              imageUrl={galleryImages[0]?.url ?? normalizeImageUrl(product.imageUrl)}
              weight={product.weight ?? undefined}
              maxStock={availableStock}
              disabled={availableStock <= 0}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
