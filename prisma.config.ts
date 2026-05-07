import nextEnv from '@next/env';
import { defineConfig } from 'prisma/config';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function resolveDatasourceUrl(): string | undefined {
  return (
    process.env.DIRECT_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Para migraciones priorizamos DIRECT_URL; en Vercel también aceptamos DATABASE_URL.
    url: resolveDatasourceUrl(),
  },
});
