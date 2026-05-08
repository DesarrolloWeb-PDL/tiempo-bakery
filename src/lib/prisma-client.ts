import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from '@prisma/extension-accelerate'

function loadLocalEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, 'utf8')

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    if (!key || process.env[key] !== undefined) {
      continue
    }

    let value = line.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

function ensurePrismaEnvLoaded() {
  const root = process.cwd()
  loadLocalEnvFile(path.join(root, '.env.local'))
  loadLocalEnvFile(path.join(root, '.env'))
}

ensurePrismaEnvLoaded()

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