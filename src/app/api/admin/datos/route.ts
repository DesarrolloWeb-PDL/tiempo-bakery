import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type ProductRow = {
  id: string
  name: string
  slug: string
  imageUrl: string
  imageAlt: string
  isActive: boolean
  published: boolean
  updatedAt: Date
  category: { id: string; name: string; slug: string }
}

function isAbsoluteLocalhostUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

function mapDbError(error: unknown, fallback: string) {
  const payload: Record<string, string> = { error: fallback }
  if (!(error instanceof Error)) return payload

  payload.details = error.message

  if (error.message.includes('Environment variable not found: DATABASE_URL')) {
    payload.error = 'Configuracion incompleta: falta DATABASE_URL'
  } else if (error.message.includes("Can't reach database server")) {
    payload.error = 'No se puede conectar a la base de datos'
  } else if (error.message.includes('does not exist')) {
    payload.error = 'La base de datos no esta migrada o faltan tablas'
  }

  return payload
}

export async function GET() {
  try {
    const [
      products,
      productCount,
      categoryCount,
      orderCount,
      userCount,
      weeklyStockCount,
      productImageCount,
      siteConfigRows,
    ] = await Promise.all([
      db.product.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          imageAlt: true,
          isActive: true,
          published: true,
          updatedAt: true,
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ updatedAt: 'desc' }],
      }),
      db.product.count(),
      db.category.count(),
      db.order.count(),
      db.user.count(),
      db.weeklyStock.count(),
      db.productImage.count(),
      db.siteConfig.findMany({
        where: {
          key: {
            in: [
              'theme_appTitle',
              'theme_appSubtitle',
              'theme_logoUrl',
              'theme_primaryColor',
              'theme_secondaryColor',
              'theme_accentColor',
            ],
          },
        },
      }),
    ])

    const themeMap = Object.fromEntries(
      siteConfigRows.map((row: { key: string; value: string }) => [row.key, row.value])
    )
    const theme = {
      appTitle: themeMap.theme_appTitle ?? 'Tiempo Bakery',
      appSubtitle: themeMap.theme_appSubtitle ?? 'Panaderia artesanal con preventa semanal',
      logoUrl: themeMap.theme_logoUrl ?? '/img/espiga.png',
      primaryColor: themeMap.theme_primaryColor ?? '#d89a44',
      secondaryColor: themeMap.theme_secondaryColor ?? '#2c2c2c',
      accentColor: themeMap.theme_accentColor ?? '#f5f5f5',
    }

    const productRows = products as ProductRow[]

    const productsWithAbsoluteLocalhostImage = productRows.filter((p) =>
      isAbsoluteLocalhostUrl(p.imageUrl)
    )

    const productsWithoutImage = productRows.filter((p) => !p.imageUrl || p.imageUrl.trim() === '')

    return NextResponse.json({
      summary: {
        products: productCount,
        categories: categoryCount,
        orders: orderCount,
        users: userCount,
        weeklyStockRows: weeklyStockCount,
        productImageRows: productImageCount,
      },
      theme,
      diagnostics: {
        localhostThemeLogo: isAbsoluteLocalhostUrl(theme.logoUrl),
        productsWithAbsoluteLocalhostImageCount: productsWithAbsoluteLocalhostImage.length,
        productsWithoutImageCount: productsWithoutImage.length,
      },
      flagged: {
        productsWithAbsoluteLocalhostImage: productsWithAbsoluteLocalhostImage.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          imageUrl: p.imageUrl,
        })),
        productsWithoutImage: productsWithoutImage.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
        })),
      },
      products: productRows,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching admin data overview:', error)
    return NextResponse.json(mapDbError(error, 'Error al obtener datos administrativos'), {
      status: 500,
    })
  }
}
