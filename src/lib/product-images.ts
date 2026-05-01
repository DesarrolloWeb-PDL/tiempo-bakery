import { prisma as db } from '@/lib/db'
import { normalizePublicAssetUrl } from '@/lib/url-normalizer'

export interface ProductImageInput {
  url: string
  altText?: string | null
}

export function normalizeExtraProductImages(
  images: ProductImageInput[] | undefined,
  primaryImageUrl: string,
  fallbackAlt: string
) {
  const normalizedPrimary = normalizePublicAssetUrl(primaryImageUrl)
  const seen = new Set<string>()

  return (images ?? [])
    .map((image) => ({
      url: normalizePublicAssetUrl(image.url.trim()),
      altText: image.altText?.trim() || fallbackAlt,
    }))
    .filter((image) => image.url && image.url !== normalizedPrimary)
    .filter((image) => {
      if (seen.has(image.url)) return false
      seen.add(image.url)
      return true
    })
}

export async function getProductExtraImages(productId: string) {
  const rows = await db.productImage.findMany({
    where: { productId, order: { gt: 0 } },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { url: true, altText: true },
  })

  return rows.map((row) => ({
    url: normalizePublicAssetUrl(row.url),
    altText: row.altText,
  }))
}

export async function syncProductImageGallery(
  product: { id: string; imageUrl: string; imageAlt: string },
  extraImages: ProductImageInput[] | undefined
) {
  const normalizedPrimary = normalizePublicAssetUrl(product.imageUrl)
  const normalizedExtras = normalizeExtraProductImages(extraImages, normalizedPrimary, product.imageAlt)

  await db.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: product.id } })
    await tx.productImage.createMany({
      data: [
        {
          productId: product.id,
          url: normalizedPrimary,
          altText: product.imageAlt,
          order: 0,
        },
        ...normalizedExtras.map((image, index) => ({
          productId: product.id,
          url: image.url,
          altText: image.altText,
          order: index + 1,
        })),
      ],
    })
  })
}