import { prisma } from './db';
import { timeGating } from './time-gating';

export class StockManager {
  private async getProductMeta(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        stockType: true,
        weeklyStock: true,
        isActive: true,
        published: true,
      },
    })
  }

  private async ensureWeeklyStockRecord(productId: string, weekId: string) {
    const existing = await prisma.weeklyStock.findUnique({
      where: {
        productId_weekId: { productId, weekId },
      },
    })

    if (existing) return existing

    const product = await this.getProductMeta(productId)
    if (!product || product.stockType !== 'WEEKLY' || !product.isActive) {
      return null
    }

    return prisma.weeklyStock.create({
      data: {
        productId,
        weekId,
        maxStock: product.weeklyStock,
        currentStock: product.weeklyStock,
        reservedStock: 0,
      },
    })
  }

  /**
   * Re-sincroniza el stock de la semana actual sin perder ventas/reservas.
   */
  async resyncWeeklyStock(weekId?: string): Promise<{ weekId: string; updated: number; created: number }> {
    const currentWeekId = weekId || timeGating.getCurrentWeekId()

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockType: 'WEEKLY',
      },
      select: {
        id: true,
        weeklyStock: true,
      },
    })

    let updated = 0
    let created = 0

    for (const product of products) {
      const existing = await prisma.weeklyStock.findUnique({
        where: {
          productId_weekId: {
            productId: product.id,
            weekId: currentWeekId,
          },
        },
      })

      if (!existing) {
        await prisma.weeklyStock.create({
          data: {
            productId: product.id,
            weekId: currentWeekId,
            maxStock: product.weeklyStock,
            currentStock: product.weeklyStock,
            reservedStock: 0,
          },
        })
        created += 1
        continue
      }

      const sold = existing.maxStock - existing.currentStock - existing.reservedStock
      const nextCurrentStock = Math.max(0, product.weeklyStock - sold - existing.reservedStock)

      await prisma.weeklyStock.update({
        where: { id: existing.id },
        data: {
          maxStock: product.weeklyStock,
          currentStock: nextCurrentStock,
        },
      })
      updated += 1
    }

    return { weekId: currentWeekId, updated, created }
  }

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

    const product = await this.getProductMeta(productId)
    if (!product || !product.isActive || !product.published) {
      return { available: false, currentStock: 0 }
    }

    if (product.stockType === 'UNLIMITED') {
      return { available: true, currentStock: Number.MAX_SAFE_INTEGER }
    }

    const stock = await this.ensureWeeklyStockRecord(productId, currentWeekId)

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

    const product = await this.getProductMeta(productId)
    if (!product || !product.isActive || !product.published) return false
    if (product.stockType === 'UNLIMITED') return true

    await this.ensureWeeklyStockRecord(productId, currentWeekId)

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

    const product = await this.getProductMeta(productId)
    if (!product || product.stockType === 'UNLIMITED') return

    await this.ensureWeeklyStockRecord(productId, currentWeekId)

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

    const product = await this.getProductMeta(productId)
    if (!product || product.stockType === 'UNLIMITED') return

    await this.ensureWeeklyStockRecord(productId, currentWeekId)

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

    const product = await this.getProductMeta(productId)
    if (!product) return null
    if (product.stockType === 'UNLIMITED') {
      return {
        maxStock: Number.MAX_SAFE_INTEGER,
        currentStock: Number.MAX_SAFE_INTEGER,
        reservedStock: 0,
        availableStock: Number.MAX_SAFE_INTEGER,
      }
    }

    const stock = await this.ensureWeeklyStockRecord(productId, currentWeekId)

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
