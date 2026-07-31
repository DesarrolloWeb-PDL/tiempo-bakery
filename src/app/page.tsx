import { ProductCard } from '@/components/productos/product-card';
import { TimeGatingBanner } from '@/components/time-gating-banner';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';
import { getTimeGatingRuntime } from '@/lib/time-gating';
import { getThemeConfig } from '@/lib/app-theme';
import Image from 'next/image';
import { Calendar, Map } from 'lucide-react';

export const dynamic = 'force-dynamic';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Obtener productos directamente desde la DB
async function getProducts() {
  try {
    const { enabled, service } = await getTimeGatingRuntime();
    const status = enabled ? service.getTimeUntilOpening() : { isOpen: true };
    const weekId = service.getCurrentWeekId();

    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        products: {
          where: { isActive: true, published: true },
          orderBy: { name: 'asc' },
          include: {
            images: {
              select: { url: true, altText: true, order: true },
              orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            },
            weeklyStocks: {
              where: { weekId },
            },
          },
        },
      },
    });

    const porCategoria = categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        productos: cat.products.map((p) => {
          const ws = p.weeklyStocks[0];
          const stockQty = ws
            ? Math.max(0, ws.currentStock - ws.reservedStock)
            : (p.stockType === 'UNLIMITED' ? 999 : p.weeklyStock);
          let allergens: string[] = [];
          try {
            allergens = JSON.parse(p.allergens || '[]');
          } catch {
            allergens = [];
          }
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: p.price,
            weight: p.weight,
            imageUrl: p.imageUrl,
            imageAlt: p.imageAlt,
            images: p.images,
            allergens,
            stock: {
              available: stockQty,
              hasStock: p.stockType === 'UNLIMITED' || stockQty > 0,
              lowStock: p.stockType !== 'UNLIMITED' && stockQty > 0 && stockQty <= 3,
            },
            category: { name: cat.name },
            allowSlicing: p.allowSlicing,
          };
        }).filter((p) => !status.isOpen || p.stock.hasStock),
      }))
      .filter((cat) => cat.productos.length > 0);

    return { porCategoria, total: porCategoria.reduce((s, c) => s + c.productos.length, 0) };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { porCategoria: [], total: 0 };
  }
}

// Obtener time-gating directamente desde la lógica de negocio
async function getTimeGatingData() {
  try {
    const { enabled, service } = await getTimeGatingRuntime();
    const config = service.getConfig()

    if (!enabled) {
      return {
        isOpen: true,
        timeRemaining: undefined,
        nextOpening: undefined,
        openingDayLabel: DAY_LABELS[config.openingDay] ?? DAY_LABELS[3],
        openingHour: config.openingHour,
        openingMinute: config.openingMinute,
        closingDayLabel: DAY_LABELS[config.closingDay] ?? DAY_LABELS[0],
        closingHour: config.closingHour,
        closingMinute: config.closingMinute,
      };
    }

    const status = service.getTimeUntilOpening();
    return {
      isOpen: status.isOpen,
      timeRemaining: status.remainingMs != null
        ? service.formatTimeRemaining(status.remainingMs)
        : undefined,
      nextOpening: status.nextOpening
        ? (status.nextOpening.toISO() ?? undefined)
        : undefined,
      openingDayLabel: DAY_LABELS[config.openingDay] ?? DAY_LABELS[3],
      openingHour: config.openingHour,
      openingMinute: config.openingMinute,
      closingDayLabel: DAY_LABELS[config.closingDay] ?? DAY_LABELS[0],
      closingHour: config.closingHour,
      closingMinute: config.closingMinute,
    };
  } catch (error) {
    console.error('Error fetching time-gating:', error);
    return {
      isOpen: true,
      timeRemaining: undefined,
      nextOpening: undefined,
      openingDayLabel: DAY_LABELS[3],
      openingHour: 18,
      openingMinute: 0,
      closingDayLabel: DAY_LABELS[0],
      closingHour: 20,
      closingMinute: 0,
    };
  }
}

export default async function HomePage() {
  const [productsData, timeGatingData, themeConfig] = await Promise.all([
    getProducts(),
    getTimeGatingData(),
    getThemeConfig(),
  ]);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: themeConfig.heroImageUrl ? `url(${themeConfig.heroImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {themeConfig.heroImageUrl && (
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      )}
      <div className="relative z-10">
        {/* Hero Section */}
        <section
          className={`relative border-b border-brand-gold/20 ${
            themeConfig.heroImageUrl
              ? 'flex items-center min-h-[80vh] bg-black/50'
              : 'bg-gradient-to-r from-brand-gold/15 to-brand-gold/5'
          }`}
        >
          <div className="container mx-auto px-4 py-12 relative z-10 w-full">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${themeConfig.heroImageUrl ? 'text-white' : 'text-brand-gold-dark'}`}>
                {themeConfig.heroTitle}
              </h1>
              <p className={`text-lg mb-6 ${themeConfig.heroImageUrl ? 'text-white/90' : 'text-brand-gold/80'}`}>
                {themeConfig.heroSubtitle}
              </p>
            
            {/* Time Gating Banner */}
            <TimeGatingBanner
              isOpen={timeGatingData.isOpen}
              timeRemaining={timeGatingData.timeRemaining}
              nextOpening={timeGatingData.nextOpening}
              openingDayLabel={timeGatingData.openingDayLabel}
              openingHour={timeGatingData.openingHour}
              openingMinute={timeGatingData.openingMinute}
              closingDayLabel={timeGatingData.closingDayLabel}
              closingHour={timeGatingData.closingHour}
              closingMinute={timeGatingData.closingMinute}
            />
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className={`container mx-auto px-4 py-12 ${themeConfig.heroImageUrl ? 'bg-black/25' : ''}`}>
        {productsData.porCategoria.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6 text-6xl">🥖</div>
            <h2 className={`text-2xl font-semibold mb-2 ${themeConfig.heroImageUrl ? 'text-white' : 'text-gray-900'}`}>
              No hay productos disponibles
            </h2>
            <p className={themeConfig.heroImageUrl ? 'text-white/70' : 'text-gray-600'}>
              {timeGatingData.isOpen
                ? 'Pronto agregaremos productos para esta semana.'
                : 'Vuelve cuando abramos para ver los productos disponibles.'}
            </p>
          </div>
        ) : (
          productsData.porCategoria.map((categoria: any) => (
            <div key={categoria.id} className="mb-16">
              {/* Category Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className={`text-3xl font-bold ${themeConfig.heroImageUrl ? 'text-white' : 'text-gray-900'}`}>
                    {categoria.name}
                  </h2>
                  <Badge variant="secondary">
                    {categoria.productos.length} productos
                  </Badge>
                </div>
                {categoria.description && (
                  <p className={themeConfig.heroImageUrl ? 'text-white/70' : 'text-gray-600'}>{categoria.description}</p>
                )}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoria.productos.map((producto: any) => (
                  <ProductCard
                    key={producto.id}
                    id={producto.id}
                    name={producto.name}
                    slug={producto.slug}
                    description={producto.description}
                    price={producto.price}
                    weight={producto.weight}
                    imageUrl={producto.imageUrl}
                    imageAlt={producto.imageAlt}
                    images={producto.images}
                    allergens={producto.allergens}
                    stock={producto.stock}
                    category={producto.category}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Info Section */}
      <section className={`border-t border-brand-gold/15 ${themeConfig.heroImageUrl ? 'bg-black/45' : 'bg-black/20'}`}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-brand-gold" />
              <h3 className="font-semibold text-brand-gold-dark mb-2">
                {themeConfig.infoTitle1}
              </h3>
              <p className="text-sm text-white/80">
                {themeConfig.infoSubtitle1}
              </p>
            </div>
            <div className="text-center">
              {themeConfig.logoUrl ? (
                <Image
                  src={themeConfig.logoUrl}
                  alt={themeConfig.infoTitle2}
                  width={40}
                  height={40}
                  className="mx-auto mb-3 w-10 h-10 object-contain"
                />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mx-auto mb-3 text-brand-gold">
                  <path d="M12 22V8" />
                  <path d="M12 8c2-2 4-2.5 4-4" />
                  <path d="M12 8c-2-2-4-2.5-4-4" />
                  <path d="M8 12c2-1 3-1.5 4-3" />
                  <path d="M16 12c-2-1-3-1.5-4-3" />
                  <path d="M7 16c1.5-1 3-2 4-3" />
                  <path d="M17 16c-1.5-1-3-2-4-3" />
                  <path d="M6 19l2-2" />
                  <path d="M18 19l-2-2" />
                </svg>
              )}
              <h3 className="font-semibold text-brand-gold-dark mb-2">
                {themeConfig.infoTitle2}
              </h3>
              <p className="text-sm text-white/80">
                {themeConfig.infoSubtitle2}
              </p>
            </div>
            <div className="text-center">
              <Map className="w-10 h-10 mx-auto mb-3 text-brand-gold" />
              <h3 className="font-semibold text-brand-gold-dark mb-2">
                {themeConfig.infoTitle3}
              </h3>
              <p className="text-sm text-white/80">
                {themeConfig.infoSubtitle3}
              </p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
