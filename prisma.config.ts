import "dotenv/config";
import { defineConfig } from 'prisma/config';

function resolveDatasourceUrl(): string | undefined {
  return process.env.DIRECT_URL ?? process.env.DATABASE_URL;
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
