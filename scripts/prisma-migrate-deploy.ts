import { spawnSync } from 'node:child_process'
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

function hasDatasourceEnv() {
  return Boolean(
    process.env.DIRECT_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL
  )
}

function shouldSkipMigrations() {
  if (process.env.SKIP_DB_MIGRATIONS === 'true') {
    return 'SKIP_DB_MIGRATIONS=true'
  }

  if (process.env.CI === 'true' && process.env.VERCEL === '1' && process.env.RUN_DB_MIGRATIONS !== 'true') {
    return 'build de Vercel sin RUN_DB_MIGRATIONS=true'
  }

  return null
}

function main() {
  if (!hasDatasourceEnv()) {
    console.log('Skipping prisma migrate deploy: no datasource URL env var configured.')
    return
  }

  const skipReason = shouldSkipMigrations()
  if (skipReason) {
    console.log(`Skipping prisma migrate deploy: ${skipReason}.`)
    return
  }

  const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

main()