import { ProductCard } from '@/components/productos/product-card';
import { TimeGatingBanner } from '@/components/time-gating-banner';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';
import { timeGating } from '@/lib/time-gating';

export const dynamic = 'force-dynamic';

// Obtener productos directamente desde la DB
async function getProducts() {
  try {
    const status = timeGating.getTimeUntilOpening();
    const weekId = timeGating.getCurrentWeekId();

    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          include: {
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
          const stock = ws ? ws.currentStock : (p.stockType === 'UNLIMITED' ? 999 : 0);
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: p.price,
            weight: p.weight,
            imageUrl: p.imageUrl,
            imageAlt: p.imageAlt,
            allergens: p.allergens,
            stock,
            category: cat.name,
            allowSlicing: p.allowSlicing,
          };
        }).filter((p) => !status.isOpen || p.stock > 0),
      }))
      .filter((cat) => cat.productos.length > 0);

    return { porCategoria, total: porCategoria.reduce((s, c) => s + c.productos.length, 0) };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { porCategoria: [], total: 0 };
  }
}

// Obtener time-gating directamente desde la lógica de negocio
function getTimeGatingData() {
  try {
    const status = timeGating.getTimeUntilOpening();
    return {
      isOpen: status.isOpen,
      timeRemaining: status.remainingMs != null
        ? timeGating.formatTimeRemaining(status.remainingMs)
        : undefined,
      nextOpening: status.nextOpening
        ? (status.nextOpening.toISO() ?? undefined)
        : undefined,
    };
  } catch (error) {
    console.error('Error fetching time-gating:', error);
    return { isOpen: true, timeRemaining: undefined, nextOpening: undefined };
  }
}

export default async function HomePage() {
  const [productsData, timeGatingData] = await Promise.all([
    getProducts(),
    Promise.resolve(getTimeGatingData()),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-100 to-amber-50 border-b border-amber-200">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-4">
              Pan Artesanal de Masa Madre
            </h1>
            <p className="text-lg text-amber-800 mb-6">
              Horneado fresco cada semana con ingredientes naturales y tiempo de fermentación tradicional
            </p>
            
            {/* Time Gating Banner */}
            <TimeGatingBanner
              isOpen={timeGatingData.isOpen}
              timeRemaining={timeGatingData.timeRemaining}
              nextOpening={timeGatingData.nextOpening}
            />
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="container mx-auto px-4 py-12">
        {productsData.porCategoria.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6 text-6xl">🥖</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No hay productos disponibles
            </h2>
            <p className="text-gray-600">
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
                  <h2 className="text-3xl font-bold text-gray-900">
                    {categoria.name}
                  </h2>
                  <Badge variant="secondary">
                    {categoria.productos.length} productos
                  </Badge>
                </div>
                {categoria.description && (
                  <p className="text-gray-600">{categoria.description}</p>
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
      <section className="bg-amber-50 border-t border-amber-100">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-3">⏰</div>
              <h3 className="font-semibold text-amber-900 mb-2">
                Preventa Semanal
              </h3>
              <p className="text-sm text-gray-600">
                Pedidos de miércoles a domingo. Entrega en fin de semana.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🌾</div>
              <h3 className="font-semibold text-amber-900 mb-2">
                Masa Madre Natural
              </h3>
              <p className="text-sm text-gray-600">
                Sin levadura industrial. Fermentación lenta y natural.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="font-semibold text-amber-900 mb-2">
                Recogida Local
              </h3>
              <p className="text-sm text-gray-600">
                Puntos de recogida en Utrera o envío a domicilio.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
