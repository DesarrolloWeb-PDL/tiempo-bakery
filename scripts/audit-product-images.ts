import { access } from 'node:fs/promises'
import path from 'node:path'
import { prisma as db } from '../src/lib/db'

type ProductWithImages = {
  id: string
  name: string
  imageUrl: string
  images: Array<{ url: string; order: number }>
}

function resolveLocalAssetPath(url: string) {
  if (!url.startsWith('/')) {
    return null
  }

  const [pathname] = url.split('?')
  if (!pathname) {
    return null
  }

  return path.join(process.cwd(), 'public', pathname.replace(/^\//, '').replace(/\//g, path.sep))
}

async function fileExists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function collectBrokenAssets(products: ProductWithImages[]) {
  const broken: Array<{
    productId: string
    productName: string
    kind: 'primary' | 'gallery'
    url: string
    order: number | null
  }> = []

  for (const product of products) {
    const primaryPath = resolveLocalAssetPath(product.imageUrl)
    if (primaryPath && !(await fileExists(primaryPath))) {
      broken.push({
        productId: product.id,
        productName: product.name,
        kind: 'primary',
        url: product.imageUrl,
        order: null,
      })
    }

    for (const image of product.images) {
      const imagePath = resolveLocalAssetPath(image.url)
      if (imagePath && !(await fileExists(imagePath))) {
        broken.push({
          productId: product.id,
          productName: product.name,
          kind: 'gallery',
          url: image.url,
          order: image.order,
        })
      }
    }
  }

  return broken
}

async function main() {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true,
      images: {
        select: { url: true, order: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: [{ name: 'asc' }],
  })

  const broken = await collectBrokenAssets(products)

  if (broken.length === 0) {
    console.log(`OK ${products.length} productos auditados, sin imágenes locales rotas.`)
    return
  }

  console.log(`FAIL ${broken.length} referencia(s) rota(s) en ${products.length} producto(s):`)

  for (const item of broken) {
    const location = item.kind === 'primary' ? 'principal' : `galeria#${item.order ?? '?'}`
    console.log(`- ${item.productName} [${item.productId}] ${location}: ${item.url}`)
  }

  process.exitCode = 1
}

main().catch((error) => {
  console.error('Image audit failed unexpectedly.')
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
}).finally(async () => {
  await db.$disconnect()
})