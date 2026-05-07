import { PrismaClient } from '@prisma/client';
import { createConfiguredPrismaClient } from './prisma-client';

// Casteamos a PrismaClient para que TypeScript infiera correctamente los tipos
// de include/select. En runtime, el valor real es el cliente extendido con Accelerate.
function createPrismaClient(): PrismaClient {
  return createConfiguredPrismaClient();
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance = globalForPrisma.prisma;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = createPrismaClient();

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  }

  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});

