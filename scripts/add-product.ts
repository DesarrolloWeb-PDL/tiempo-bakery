import nextEnv from '@next/env';
import { createConfiguredPrismaClient } from '../src/lib/prisma-client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = createConfiguredPrismaClient();

async function main() {
  console.log('🔍 Verificando conexión a la base de datos...');

  let categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.log('📦 Creando categorías...');
    const panes = await prisma.category.create({
      data: { name: 'Panes', slug: 'panes', description: 'Panes artesanales', order: 1 },
    });
    const dulces = await prisma.category.create({
      data: { name: 'Dulces', slug: 'dulces', description: 'Bollería y dulces', order: 2 },
    });
    categories = [panes, dulces];
    console.log('✅ Categorías creadas');
  }

  const panesCategory = categories.find((c) => c.slug === 'panes') || categories[0];

  const productData = {
    name: 'Pan de Masa Madre Clásico',
    slug: 'pan-masa-madre-clasico',
    description: 'Pan artesanal de masa madre con fermentación lenta (24h). Corteza crujiente y miga alveolada.',
    price: 4.50,
    weight: 500,
    ingredients: 'Harina de trigo ecológica, agua, masa madre, sal marina',
    allergens: JSON.stringify(['Gluten']),
    riskNote: null,
    imageUrl: '/images/productos/pan-espelta.jpg',
    imageAlt: 'Pan de masa madre clásico',
    stockType: 'WEEKLY',
    weeklyStock: 30,
    allowSlicing: true,
    isActive: true,
    published: true,
    categoryId: panesCategory.id,
  };

  const product = await prisma.product.upsert({
    where: { slug: productData.slug },
    update: productData,
    create: productData,
  });

  console.log(`✅ Producto creado: ${product.name} (${product.id})`);

  const weekId = new Date().toISOString().slice(0, 7);
  await prisma.weeklyStock.upsert({
    where: { productId_weekId: { productId: product.id, weekId } },
    update: { maxStock: 30, currentStock: 30, reservedStock: 0 },
    create: {
      productId: product.id,
      weekId,
      maxStock: 30,
      currentStock: 30,
      reservedStock: 0,
    },
  });

  console.log(`✅ Stock semanal creado para semana ${weekId}`);

  const existingImage = await prisma.productImage.findFirst({
    where: { productId: product.id },
  });
  if (!existingImage) {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: '/images/productos/pan-espelta.jpg',
        altText: 'Pan de masa madre clásico',
        order: 0,
      },
    });
    console.log('✅ Imagen de producto creada');
  }

  console.log('🎉 Producto listo para comprar!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
