import nextEnv from '@next/env';
import { createConfiguredPrismaClient } from '../src/lib/prisma-client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function main() {
  const prisma = createConfiguredPrismaClient();
  
  // Eliminar token de MP guardado en DB para que use el del .env.local
  await prisma.siteConfig.deleteMany({
    where: { key: { startsWith: 'payment_cred_mercadopago' } },
  });
  
  console.log('✅ Token de MP eliminado de la DB. Usará el del .env.local');
  await prisma.$disconnect();
}

main().catch(console.error);
