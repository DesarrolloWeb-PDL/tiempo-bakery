import nextEnv from '@next/env';
import { createConfiguredPrismaClient } from '../src/lib/prisma-client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = createConfiguredPrismaClient();

async function main() {
  // Obtener el weekId correcto usando la misma lógica que el checkout
  const { timeGating } = await import('../src/lib/time-gating');
  const correctWeekId = timeGating.getCurrentWeekId();
  console.log('Semana actual (ISO):', correctWeekId);

  // Buscar todos los WeeklyStock con formato incorrecto
  const allStocks = await prisma.weeklyStock.findMany();
  for (const stock of allStocks) {
    console.log(`Stock: productId=${stock.productId}, weekId=${stock.weekId}, current=${stock.currentStock}`);
    
    if (stock.weekId !== correctWeekId) {
      // Actualizar al formato correcto
      await prisma.weeklyStock.upsert({
        where: { productId_weekId: { productId: stock.productId, weekId: correctWeekId } },
        update: {
          maxStock: stock.maxStock,
          currentStock: stock.currentStock,
          reservedStock: stock.reservedStock,
        },
        create: {
          productId: stock.productId,
          weekId: correctWeekId,
          maxStock: stock.maxStock,
          currentStock: stock.currentStock,
          reservedStock: stock.reservedStock,
        },
      });
      console.log(`  -> Creado/actualizado con weekId: ${correctWeekId}`);
    }
  }

  console.log('\n✅ Stock corregido!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
