import "dotenv/config";
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // URL directa a la base de datos (usada por el CLI de Prisma para migraciones)
    url: process.env.DIRECT_URL!,
  },
});
