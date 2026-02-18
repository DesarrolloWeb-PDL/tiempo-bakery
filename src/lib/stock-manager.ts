import { prisma } from './db';
import { timeGating } from './time-gating';

export class StockManager {
  /**
   * Inicializa el stock para una nueva semana
   */
  async initializeWeeklyStock(weekId?: string): Promise<void> {
    const currentWeekId = weekId || timeGating.getCurrentWeekId();

    // Obtener todos los productos activos
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        stockType: 'WEEKLY'
      },
    });

    // Crear registros de stock semanal
    for (const product of products) {
      await prisma.weeklyStock.upsert({
        where: {
          productId_weekId: {
            productId: product.id,
            weekId: currentWeekId,
          },
        },
        create: {
          productId: product.id,
          weekId: currentWeekId,
          maxStock: product.weeklyStock,
          currentStock: product.weeklyStock,
          reservedStock: 0,
        },
        update: {
          maxStock: product.weeklyStock,
          currentStock: product.weeklyStock,
        },
      });
    }
  }

  /**
   * Verifica disponibilidad de stock
   */
  async checkAvailability(
    productId: string,
    quantity: number,
    weekId?: string
  ): Promise<{ available: boolean; currentStock: number }> {
    const currentWeekId = weekId || timeGating.getCurrentWeekId();

    const stock = await prisma.weeklyStock.findUnique({
      where: {
        productId_weekId: {
          productId,
          weekId: currentWeekId,
        },
      },
    });

    if (!stock) {
      return { available: false, currentStock: 0 };
    }

    const availableStock = stock.currentStock - stock.reservedStock;
    return {
      available: availableStock >= quantity,
      currentStock: availableStock,
    };
  }

  /**
   * Reserva stock temporalmente (para carritos)
   */
  async reserveStock(
    productId: string,
    quantity: number,
    weekId?: string
  ): Promise<boolean> {
    const currentWeekId = weekId || timeGating.getCurrentWeekId();

    try {
      const stock = await prisma.weeklyStock.update({
        where: {
          productId_weekId: {
            productId,
            weekId: currentWeekId,
          },
        },
        data: {
          reservedStock: {
            increment: quantity,
          },
        },
      });

      // Verificar que no sobrepasamos el stock disponible
      if (stock.reservedStock > stock.currentStock) {
        // Revertir reserva
        await this.releaseStock(productId, quantity, weekId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error reserving stock:', error);
      return false;
    }
  }

  /**
   * Libera stock reservado
   */
  async releaseStock(
    productId: string,
    quantity: number,
    weekId?: string
  ): Promise<void> {
    const currentWeekId = weekId || timeGating.getCurrentWeekId();

    await prisma.weeklyStock.update({
      where: {
        productId_weekId: {
          productId,
          weekId: currentWeekId,
        },
      },
      data: {
        reservedStock: {
          decrement: quantity,
        },
      },
    });
  }

  /**
   * Confirma una venta (decrementa stock real)
   */
  async confirmSale(
    productId: string,
    quantity: number,
    weekId?: string
  ): Promise<void> {
    const currentWeekId = weekId || timeGating.getCurrentWeekId();

    await prisma.weeklyStock.update({
      where: {
        productId_weekId: {
          productId,
          weekId: currentWeekId,
        },
      },
      data: {
        currentStock: {
          decrement: quantity,
        },
        reservedStock: {
          decrement: quantity,
        },
      },
    });
  }

  /**
   * Obtiene el stock actual de un producto
   */
  async getProductStock(
    productId: string,
    weekId?: string
  ): Promise<{
    maxStock: number;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
  } | null> {
    const currentWeekId = weekId || timeGating.getCurrentWeekId();

    const stock = await prisma.weeklyStock.findUnique({
      where: {
        productId_weekId: {
          productId,
          weekId: currentWeekId,
        },
      },
    });

    if (!stock) return null;

    return {
      maxStock: stock.maxStock,
      currentStock: stock.currentStock,
      reservedStock: stock.reservedStock,
      availableStock: stock.currentStock - stock.reservedStock,
    };
  }

  /**
   * Obtiene todos los productos con su stock disponible
   */
  async getProductsWithStock(weekId?: string) {
    const currentWeekId = weekId || timeGating.getCurrentWeekId();

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        weeklyStocks: {
          where: { weekId: currentWeekId },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return products.map((product) => {
      const stock = product.weeklyStocks[0];
      const availableStock = stock 
        ? stock.currentStock - stock.reservedStock 
        : 0;

      return {
        ...product,
        availableStock,
        isOutOfStock: availableStock <= 0,
      };
    });
  }
}

export const stockManager = new StockManager();
