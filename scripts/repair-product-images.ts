import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { prisma as db } from '../src/lib/db'

type ProductRow = {
  id: string
  name: string
  slug: string
  imageUrl: string
  imageAlt: string
  images: Array<{ id: string; url: string; order: number }>
}

type PlannedChange = {
  productId: string
  productName: string
  targetUrl: string
  primaryChanged: boolean
  galleryUpdates: Array<{ imageId: string; order: number; from: string; to: string }>
}

function normalizeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolvePublicUrl(fileName: string) {
  return `/images/productos/${fileName}`
}

async function loadAvailableAssets() {
  const dir = path.join(process.cwd(), 'public', 'images', 'productos')
  const files = await readdir(dir, { withFileTypes: true })

  return files
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      fileName: entry.name,
      slug: normalizeSlug(entry.name.replace(/\.[^.]+$/, '')),
      publicUrl: resolvePublicUrl(entry.name),
    }))
}

function chooseReplacement(product: ProductRow, assets: Awaited<ReturnType<typeof loadAvailableAssets>>) {
  const productSlug = normalizeSlug(product.slug || product.name)
  const productNameSlug = normalizeSlug(product.name)
  const candidates = assets.filter((asset) => {
    if (asset.slug === productSlug || asset.slug === productNameSlug) {
      return true
    }

    return productSlug.includes(asset.slug) || productNameSlug.includes(asset.slug) || asset.slug.includes(productSlug)
  })

  if (candidates.length === 1) {
    return candidates[0].publicUrl
  }

  return null
}

function hasBrokenLocalRef(url: string) {
  return url.startsWith('/uploads/productos/')
}

async function buildPlan() {
  const assets = await loadAvailableAssets()
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      imageAlt: true,
      images: {
        select: { id: true, url: true, order: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: [{ name: 'asc' }],
  })

  const plan: PlannedChange[] = []

  for (const product of products) {
    const relevantImages = product.images.filter((image) => hasBrokenLocalRef(image.url))
    const primaryBroken = hasBrokenLocalRef(product.imageUrl)

    if (!primaryBroken && relevantImages.length === 0) {
      continue
    }

    const replacement = chooseReplacement(product, assets)
    if (!replacement) {
      continue
    }

    plan.push({
      productId: product.id,
      productName: product.name,
      targetUrl: replacement,
      primaryChanged: primaryBroken,
      galleryUpdates: relevantImages.map((image) => ({
        imageId: image.id,
        order: image.order,
        from: image.url,
        to: replacement,
      })),
    })
  }

  return plan
}

async function applyPlan(plan: PlannedChange[]) {
  for (const change of plan) {
    await db.$transaction(async (tx) => {
      if (change.primaryChanged) {
        await tx.product.update({
          where: { id: change.productId },
          data: { imageUrl: change.targetUrl },
        })
      }

      for (const image of change.galleryUpdates) {
        await tx.productImage.update({
          where: { id: image.imageId },
          data: { url: image.to },
        })
      }
    })
  }
}

async function main() {
  const shouldApply = process.argv.includes('--apply')
  const plan = await buildPlan()

  if (plan.length === 0) {
    console.log('OK no hay reparaciones automáticas sugeridas.')
    return
  }

  console.log(`FOUND ${plan.length} producto(s) con reemplazo sugerido:`)
  for (const change of plan) {
    console.log(`- ${change.productName} [${change.productId}] -> ${change.targetUrl}`)
    if (change.primaryChanged) {
      console.log('  principal: se actualiza imageUrl')
    }
    for (const image of change.galleryUpdates) {
      console.log(`  galeria#${image.order}: ${image.from} -> ${image.to}`)
    }
  }

  if (!shouldApply) {
    console.log('\nDry run solamente. Ejecutá `npm run images:repair -- --apply` para aplicar.')
    return
  }

  await applyPlan(plan)
  console.log(`\nAPPLIED ${plan.length} producto(s) reparado(s).`)
}

main().catch((error) => {
  console.error('Image repair failed unexpectedly.')
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
}).finally(async () => {
  await db.$disconnect()
})