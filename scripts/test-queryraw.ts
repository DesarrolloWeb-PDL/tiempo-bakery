import nextEnv from '@next/env';
import { createConfiguredPrismaClient } from '../src/lib/prisma-client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function main() {
  const prisma = createConfiguredPrismaClient();

  try {
    // Test 1: regular query
    console.log('Test 1: findMany...');
    const stocks = await prisma.weeklyStock.findMany({ take: 1 });
    console.log('  OK:', stocks.length, 'results');

    // Test 2: $queryRaw
    console.log('Test 2: $queryRaw...');
    try {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        UPDATE "WeeklyStock"
        SET "reservedStock" = "reservedStock" + 0
        WHERE "id" = ${stocks[0].id}
        RETURNING "id"
      `;
      console.log('  OK:', rows);
    } catch (err: any) {
      console.log('  ERROR:', err.message);
    }

    // Test 3: $queryRaw SELECT
    console.log('Test 3: $queryRaw SELECT...');
    try {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "WeeklyStock" LIMIT 1
      `;
      console.log('  OK:', rows);
    } catch (err: any) {
      console.log('  ERROR:', err.message);
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('FATAL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
