import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { timeGating } from '@/lib/time-gating';

/**
 * GET /api/productos/[slug]
 * Obtiene el detalle de un producto específico con su stock actual
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const currentWeekId = timeGating.getCurrentWeekId();

    const producto = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
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
    });

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    if (!producto.isActive) {
      return NextResponse.json(
        { error: 'Producto no disponible' },
        { status: 404 }
      );
    }

    const stockInfo = producto.weeklyStocks[0];
    const availableStock = stockInfo
      ? stockInfo.currentStock - stockInfo.reservedStock
      : 0;

    const response = {
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
        lowStock: availableStock > 0 && availableStock <= 5,
      },
      weekId: currentWeekId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Error al obtener el producto' },
      { status: 500 }
    );
  }
}
