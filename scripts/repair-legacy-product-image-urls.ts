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

type PlannedGalleryUpdate = {
  imageId: string
  order: number
  from: string
  to: string
}

type PlannedChange = {
  productId: string
  productName: string
  targetUrl: string
  primaryChanged: boolean
  galleryUpdates: PlannedGalleryUpdate[]
  reason: 'asset-match' | 'fallback'
}

const DEFAULT_FALLBACK_IMAGE = '/img/espiga.png'

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

function normalizeUrl(rawUrl: string) {
  const trimmed = rawUrl.trim()

  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
    return trimmed
  } catch {
    return trimmed
  }
}

function isLegacyProductImageUrl(url: string) {
  const normalized = normalizeUrl(url)

  return normalized.startsWith('/uploads/productos/')
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
    return { targetUrl: candidates[0].publicUrl, reason: 'asset-match' as const }
  }

  return { targetUrl: DEFAULT_FALLBACK_IMAGE, reason: 'fallback' as const }
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
    const normalizedPrimary = normalizeUrl(product.imageUrl)
    const primaryBroken = isLegacyProductImageUrl(normalizedPrimary)

    const relevantImages = product.images.filter((image) => isLegacyProductImageUrl(normalizeUrl(image.url)))

    if (!primaryBroken && relevantImages.length === 0) {
      continue
    }

    const replacement = chooseReplacement(product, assets)

    plan.push({
      productId: product.id,
      productName: product.name,
      targetUrl: replacement.targetUrl,
      reason: replacement.reason,
      primaryChanged: primaryBroken,
      galleryUpdates: relevantImages.map((image) => ({
        imageId: image.id,
        order: image.order,
        from: image.url,
        to: replacement.targetUrl,
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
    console.log('OK no se detectaron URLs legacy para reparar.')
    return
  }

  const matched = plan.filter((item) => item.reason === 'asset-match').length
  const fallback = plan.filter((item) => item.reason === 'fallback').length

  console.log(`FOUND ${plan.length} producto(s) con URLs legacy.`)
  console.log(`- reemplazo por imagen del catalogo: ${matched}`)
  console.log(`- reemplazo por fallback: ${fallback}`)

  for (const change of plan) {
    const source = change.reason === 'asset-match' ? 'asset-match' : 'fallback'
    console.log(`- ${change.productName} [${change.productId}] -> ${change.targetUrl} (${source})`)

    if (change.primaryChanged) {
      console.log('  principal: se actualiza imageUrl')
    }

    for (const image of change.galleryUpdates) {
      console.log(`  galeria#${image.order}: ${image.from} -> ${image.to}`)
    }
  }

  if (!shouldApply) {
    console.log('\nDry run solamente. Ejecuta npm run images:repair:legacy-urls -- --apply para aplicar.')
    return
  }

  await applyPlan(plan)
  console.log(`\nAPPLIED ${plan.length} producto(s) reparado(s).`)
}

main().catch((error) => {
  console.error('Legacy URL repair failed unexpectedly.')
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
}).finally(async () => {
  await db.$disconnect()
})
