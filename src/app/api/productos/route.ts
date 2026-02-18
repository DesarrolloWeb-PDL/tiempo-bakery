import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { timeGating } from '@/lib/time-gating';

export const dynamic = 'force-dynamic';

/**
 * GET /api/productos
 * Lista todos los productos activos con información de stock
 * Query params:
 * - categoria: filtrar por slug de categoría
 * - disponibles: solo productos con stock (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoriaSlug = searchParams.get('categoria');
    const soloDisponibles = searchParams.get('disponibles') === 'true';

    const currentWeekId = timeGating.getCurrentWeekId();

    // Construir query
    const whereClause: any = {
      isActive: true,
      published: true, // Solo mostrar productos publicados
    };

    if (categoriaSlug) {
      whereClause.category = {
        slug: categoriaSlug,
      };
    }

    // Obtener productos con stock
    const productos = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        weeklyStocks: {
          where: {
            weekId: currentWeekId,
          },
          select: {
            maxStock: true,
            currentStock: true,
            reservedStock: true,
          },
        },
      },
      orderBy: [
        { category: { order: 'asc' } },
        { name: 'asc' },
      ],
    });

    // Formatear respuesta con información de stock
    const productosConStock = productos.map(producto => {
      const stockInfo = producto.weeklyStocks[0];
      const availableStock = stockInfo
        ? stockInfo.currentStock - stockInfo.reservedStock
        : 0;

      return {
        id: producto.id,
        name: producto.name,
        slug: producto.slug,
        description: producto.description,
        price: Number(producto.price),
        weight: producto.weight,
        ingredients: producto.ingredients,
        allergens: JSON.parse(producto.allergens || '[]'),
        riskNote: producto.riskNote,
        imageUrl: producto.imageUrl,
        imageAlt: producto.imageAlt,
        allowSlicing: producto.allowSlicing,
        category: producto.category,
        stock: {
          available: availableStock,
          max: stockInfo?.maxStock || 0,
          hasStock: availableStock > 0,
        },
      };
    });

    // Filtrar solo disponibles si se requiere
    const productosFiltrados = soloDisponibles
      ? productosConStock.filter(p => p.stock.hasStock)
      : productosConStock;

    // Agrupar por categoría
    const categorias = await prisma.category.findMany({
      orderBy: { order: 'asc' },
    });

    const productosPorCategoria = categorias.map(categoria => ({
      id: categoria.id,
      name: categoria.name,
      slug: categoria.slug,
      description: categoria.description,
      productos: productosFiltrados.filter(
        p => p.category.id === categoria.id
      ),
    }));

    return NextResponse.json({
      productos: productosFiltrados,
      porCategoria: productosPorCategoria.filter(c => c.productos.length > 0),
      weekId: currentWeekId,
      total: productosFiltrados.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error al obtener los productos' },
      { status: 500 }
    );
  }
}
