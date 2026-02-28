import { defineConfig } from '@prisma/cli';

export default defineConfig({
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/dbname',
    },
  },
});