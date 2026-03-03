import { defineConfig } from 'prisma';

export default defineConfig({
  datasources: {
    db: {
      // URL directa para CLI (migraciones, db pull)
      url: process.env.DATABASE_URL!,
      // URL de Accelerate para el cliente en producción
      accelerateUrl: process.env.ACCELERATE_URL!,
    },
  },
});