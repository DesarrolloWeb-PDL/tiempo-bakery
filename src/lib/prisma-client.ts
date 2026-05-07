import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from '@prisma/extension-accelerate'

function isAccelerateUrl(url: string): boolean {
  return url.startsWith('prisma://') || url.startsWith('prisma+postgres://')
}

export function resolvePrismaConnectionUrls() {
  const accelerateUrl =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL

  const directUrl =
    process.env.DIRECT_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.DATABASE_URL

  return { accelerateUrl, directUrl }
}

export function createConfiguredPrismaClient(): PrismaClient {
  const { accelerateUrl, directUrl } = resolvePrismaConnectionUrls()

  if (accelerateUrl && isAccelerateUrl(accelerateUrl)) {
    return new PrismaClient({
      accelerateUrl,
    }).$extends(withAccelerate()) as unknown as PrismaClient
  }

  const connectionString = directUrl ?? accelerateUrl

  if (!connectionString) {
    throw new Error('No hay una URL de Prisma configurada en el entorno')
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}