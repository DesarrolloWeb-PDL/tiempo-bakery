import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

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

loadLocalEnvFile(path.join(process.cwd(), '.env.local'))
loadLocalEnvFile(path.join(process.cwd(), '.env'))

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