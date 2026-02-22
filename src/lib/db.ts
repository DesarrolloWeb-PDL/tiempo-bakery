import { PrismaClient } from '@prisma/client';

const inferredDatabaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING;

if (!process.env.DATABASE_URL && inferredDatabaseUrl) {
  process.env.DATABASE_URL = inferredDatabaseUrl;
}

if (!process.env.POSTGRES_URL && inferredDatabaseUrl) {
  process.env.POSTGRES_URL = inferredDatabaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
