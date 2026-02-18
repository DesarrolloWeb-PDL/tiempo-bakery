import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear categorías
  const panesCategory = await prisma.category.upsert({
    where: { slug: 'panes' },
    update: {},
    create: {
      name: 'Panes',
      slug: 'panes',
      description: 'Panes artesanales elaborados con masa madre',
      order: 1,
    },
  });

  const dulcesCategory = await prisma.category.upsert({
    where: { slug: 'dulces' },
    update: {},
    create: {
      name: 'Dulces',
      slug: 'dulces',
      description: 'Bollería y dulces artesanales',
      order: 2,
    },
  });

  console.log('✅ Categorías creadas');

  // Crear productos de ejemplo
  const products = [
    {
      name: 'Pan de Espelta Integral',
      slug: 'pan-espelta-integral',
      description: 'Pan elaborado con harina de espelta integral 100%, masa madre y sal. Miga densa y sabrosa, corteza crujiente.',
      price: 4.50,
      weight: 500,
      ingredients: 'Harina de espelta integral, agua, masa madre, sal',
      allergens: ['Gluten'],
      riskNote: 'Elaborado en instalaciones donde se manipulan frutos secos',
      imageUrl: '/images/productos/pan-espelta.jpg',
      imageAlt: 'Pan de espelta integral',
      weeklyStock: 20,
      allowSlicing: true,
      isActive: true,
      categoryId: panesCategory.id,
    },
    {
      name: 'Pan de Centeno y Semillas',
      slug: 'pan-centeno-semillas',
      description: 'Pan rústico de centeno con semillas de girasol, lino y sésamo. Ideal para tostadas.',
      price: 5.00,
      weight: 600,
      ingredients: 'Harina de centeno, harina de trigo, agua, masa madre, semillas (girasol, lino, sésamo), sal',
      allergens: ['Gluten', 'Sésamo'],
      riskNote: null,
      imageUrl: '/images/productos/pan-centeno.jpg',
      imageAlt: 'Pan de centeno con semillas',
      weeklyStock: 15,
      allowSlicing: true,
      isActive: true,
      categoryId: panesCategory.id,
    },
    {
      name: 'Hogaza Rústica',
      slug: 'hogaza-rustica',
      description: 'Hogaza grande de pan blanco con masa madre. Perfecta para toda la semana.',
      price: 6.50,
      weight: 800,
      ingredients: 'Harina de trigo, agua, masa madre, sal',
      allergens: ['Gluten'],
      riskNote: null,
      imageUrl: '/images/productos/hogaza-rustica.jpg',
      imageAlt: 'Hogaza rústica',
      weeklyStock: 25,
      allowSlicing: true,
      isActive: true,
      categoryId: panesCategory.id,
    },
    {
      name: 'Croissant de Mantequilla',
      slug: 'croissant-mantequilla',
      description: 'Croissant artesanal elaborado con mantequilla de calidad. Hojaldrado y crujiente.',
      price: 2.20,
      weight: 80,
      ingredients: 'Harina de trigo, mantequilla (24%), agua, azúcar, levadura, sal, huevo',
      allergens: ['Gluten', 'Lácteos', 'Huevo'],
      riskNote: null,
      imageUrl: '/images/productos/croissant.jpg',
      imageAlt: 'Croissant de mantequilla',
      weeklyStock: 30,
      allowSlicing: false,
      isActive: true,
      categoryId: dulcesCategory.id,
    },
    {
      name: 'Napolitana de Chocolate',
      slug: 'napolitana-chocolate',
      description: 'Napolitana de hojaldre con generoso relleno de chocolate.',
      price: 2.50,
      weight: 100,
      ingredients: 'Harina de trigo, mantequilla, chocolate (18%), agua, azúcar, levadura, sal, huevo',
      allergens: ['Gluten', 'Lácteos', 'Huevo', 'Soja'],
      riskNote: 'El chocolate puede contener trazas de frutos secos',
      imageUrl: '/images/productos/napolitana.jpg',
      imageAlt: 'Napolitana de chocolate',
      weeklyStock: 25,
      allowSlicing: false,
      isActive: true,
      categoryId: dulcesCategory.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...product,
        allergens: JSON.stringify(product.allergens), // Convertir array a JSON string
      },
    });
  }

  console.log('✅ Productos creados');

  // Crear puntos de recogida
  const pickupPoints = [
    {
      name: 'Bulevar Utrera',
      address: 'Calle Bulevar, 12',
      city: 'Utrera',
      postalCode: '41710',
      schedule: 'Viernes 17:00-20:00, Sábado 10:00-14:00',
      instructions: 'Preguntar por el mostrador de panadería',
      isActive: true,
      order: 1,
    },
    {
      name: 'Cero Coma',
      address: 'Calle Principal, 45',
      city: 'Utrera',
      postalCode: '41710',
      schedule: 'Viernes 18:00-21:00, Sábado 11:00-14:00',
      instructions: null,
      isActive: true,
      order: 2,
    },
  ];

  // Limpiar puntos existentes y crear nuevos
  await prisma.pickupPoint.deleteMany({});
  await prisma.pickupPoint.createMany({
    data: pickupPoints,
  });

  console.log('✅ Puntos de recogida creados');

  // Configuración del sitio
  const configs = [
    { key: 'time_gating_enabled', value: 'true' },
    { key: 'opening_day', value: '3' }, // Miércoles
    { key: 'opening_hour', value: '18' },
    { key: 'closing_day', value: '0' }, // Domingo
    { key: 'closing_hour', value: '20' },
    { key: 'shipping_cost_national', value: '5.95' },
    { key: 'shipping_cost_local', value: '3.50' },
  ];

  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }

  console.log('✅ Configuración del sitio creada');
  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
