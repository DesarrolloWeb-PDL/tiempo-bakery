import nextEnv from '@next/env';
import { createConfiguredPrismaClient } from '../src/lib/prisma-client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function main() {
  const prisma = createConfiguredPrismaClient();

  try {
    console.log('=== Verificando tabla SiteConfig ===');
    const configs = await prisma.siteConfig.findMany();
    console.log('SiteConfig entries:', configs.length);
    configs.forEach(c => console.log(`  ${c.key} = ${c.value}`));

    console.log('\n=== Verificando categorías ===');
    const categories = await prisma.category.findMany();
    console.log('Categories:', categories.length);
    categories.forEach(c => console.log(`  ${c.name} (${c.id})`));

    console.log('\n=== Verificando productos ===');
    const products = await prisma.product.findMany({
      where: { published: true, isActive: true },
    });
    console.log('Published active products:', products.length);
    products.forEach(p => console.log(`  ${p.name} - $${p.price} - stockType: ${p.stockType} - weeklyStock: ${p.weeklyStock}`));

    console.log('\n=== Verificando WeeklyStock ===');
    const stocks = await prisma.weeklyStock.findMany();
    console.log('Weekly stocks:', stocks.length);
    stocks.forEach(s => console.log(`  productId: ${s.productId}, weekId: ${s.weekId}, current: ${s.currentStock}, reserved: ${s.reservedStock}`));

    console.log('\n=== Payment settings check ===');
    const { getPaymentSettings } = await import('../src/lib/payments');
    const settings = await getPaymentSettings();
    console.log('Enabled providers:', settings.enabledProviders);
    console.log('Default provider:', settings.defaultProvider);

    console.log('\n=== Shipping costs check ===');
    const { getShippingCostsRuntime } = await import('../src/lib/shipping-costs');
    const costs = await getShippingCostsRuntime();
    console.log('Costs:', costs);

    console.log('\n=== Time gating check ===');
    const { getTimeGatingRuntime } = await import('../src/lib/time-gating');
    const tg = await getTimeGatingRuntime();
    console.log('Time gating enabled:', tg.enabled);
    console.log('Is open:', tg.service.isOpen());

    console.log('\n✅ Todo OK!');
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
