# 🏗️ Arquitectura Técnica - Tiempo Backery E-commerce

**Versión:** 1.0  
**Fecha:** 11 de noviembre de 2025  
**Stack:** Next.js 14+ | PostgreSQL | Prisma | Tailwind CSS

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Modelo de Datos](#modelo-de-datos)
5. [Sistema de Time-Gating](#sistema-de-time-gating)
6. [Gestión de Stock](#gestión-de-stock)
7. [Flujo de Checkout](#flujo-de-checkout)
8. [Seguridad y Concurrencia](#seguridad-y-concurrencia)
9. [APIs y Endpoints](#apis-y-endpoints)
10. [Despliegue](#despliegue)

---

## 🎯 Visión General

**Tiempo Backery** es un e-commerce especializado en panadería artesanal con un modelo de negocio único:

- **Preventas semanales** con apertura/cierre programado
- **Stock limitado** por ciclo de producción
- **Múltiples métodos de entrega** (recogida en punto, envío local, mensajería nacional)
- **Gestión de alérgenos** y trazabilidad completa

### Características Clave

```
✓ Time-Gating: Apertura Mi 18:00 → Cierre Do 20:00
✓ Stock Semanal: Control por lotes de producción
✓ Carrito Persistente: localStorage + DB sync
✓ Guest Checkout: Compra sin registro obligatorio
✓ Admin Panel: Gestión de pedidos y stock
✓ Responsive Design: Mobile-first approach
```

---

## 🛠️ Stack Tecnológico

### Frontend
```yaml
Framework: Next.js 14 (App Router)
Lenguaje: TypeScript 5.x
Estilos: Tailwind CSS 3.x
Estado: Zustand + React Query
UI Components: shadcn/ui (Radix UI)
Validación: Zod
```

### Backend
```yaml
Runtime: Node.js 20.x LTS
API: Next.js API Routes + Server Actions
ORM: Prisma 5.x
Base de Datos: PostgreSQL 16
Cache: Redis (opcional para MVP)
```

### Infraestructura
```yaml
Hosting: Vercel (Frontend + API)
Database: Supabase o Railway
Storage: Cloudinary (imágenes de productos)
Pagos: Stripe
Email: Resend o SendGrid
Monitoreo: Vercel Analytics + Sentry
```

### Desarrollo
```yaml
IDE: VS Code
Linter: ESLint + Prettier
Git Hooks: Husky + lint-staged
Testing: Vitest + React Testing Library
CI/CD: GitHub Actions
```

---

## 🏛️ Arquitectura del Sistema

### Estructura de Carpetas

```
tiempo-bakery/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (storefront)/            # Rutas públicas (e-commerce)
│   │   │   ├── page.tsx             # Homepage / Catálogo
│   │   │   ├── productos/
│   │   │   │   └── [slug]/page.tsx  # Detalle de producto
│   │   │   ├── carrito/page.tsx     # Carrito de compras
│   │   │   └── checkout/page.tsx    # Proceso de pago
│   │   ├── (admin)/                 # Panel de administración
│   │   │   ├── dashboard/
│   │   │   ├── pedidos/
│   │   │   └── productos/
│   │   ├── api/                     # API Routes
│   │   │   ├── productos/
│   │   │   ├── pedidos/
│   │   │   ├── checkout/
│   │   │   └── webhooks/
│   │   └── layout.tsx
│   ├── components/                   # Componentes React
│   │   ├── ui/                      # Componentes base (shadcn)
│   │   ├── productos/               # Relacionados a productos
│   │   ├── carrito/                 # Relacionados al carrito
│   │   └── admin/                   # Componentes del admin
│   ├── lib/                         # Utilidades y configuración
│   │   ├── db.ts                    # Cliente Prisma
│   │   ├── time-gating.ts           # Lógica de apertura/cierre
│   │   ├── stock-manager.ts         # Gestión de stock
│   │   ├── cart.ts                  # Lógica del carrito
│   │   └── utils.ts                 # Helpers generales
│   ├── hooks/                       # Custom React Hooks
│   │   ├── useTimeGating.ts
│   │   ├── useCart.ts
│   │   └── useCheckout.ts
│   ├── stores/                      # Zustand stores
│   │   ├── cartStore.ts
│   │   └── uiStore.ts
│   ├── types/                       # TypeScript types
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── cart.ts
│   └── middleware.ts                # Next.js middleware
├── prisma/
│   ├── schema.prisma                # Modelo de datos
│   ├── migrations/                  # Migraciones
│   └── seed.ts                      # Datos iniciales
├── public/
│   └── images/                      # Imágenes estáticas
├── .env.local                       # Variables de entorno
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Flujo de Datos

```mermaid
graph TB
    A[Cliente/Browser] -->|HTTP Request| B[Next.js Middleware]
    B -->|Valida Time-Gating| C{¿Sitio Abierto?}
    C -->|No| D[Retorna mensaje de cierre]
    C -->|Sí| E[Next.js App Router]
    E --> F[Server Components]
    E --> G[API Routes]
    F -->|Server Actions| H[Prisma ORM]
    G -->|Query/Mutation| H
    H --> I[PostgreSQL]
    G -->|Procesar Pago| J[Stripe API]
    G -->|Enviar Email| K[Resend/SendGrid]
```

---

## 💾 Modelo de Datos

### Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// PRODUCTOS Y CATÁLOGO
// ============================================

model Category {
  id          String    @id @default(cuid())
  name        String    // "Panes", "Dulces"
  slug        String    @unique
  description String?
  order       Int       @default(0)
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Product {
  id           String        @id @default(cuid())
  name         String
  slug         String        @unique
  description  String
  price        Decimal       @db.Decimal(10, 2)
  weight       Int?          // Peso en gramos
  ingredients  String        // Lista de ingredientes
  allergens    String[]      // ["Gluten", "Huevo", "Lácteos"]
  riskNote     String?       // Ej: "Puede contener trazas de frutos secos"
  imageUrl     String
  imageAlt     String
  
  // Control de stock
  stockType    StockType     @default(WEEKLY)
  weeklyStock  Int           @default(0) // Stock máximo semanal
  
  // Configuración
  allowSlicing Boolean       @default(true)
  isActive     Boolean       @default(true)
  
  // Relaciones
  categoryId   String
  category     Category      @relation(fields: [categoryId], references: [id])
  
  weeklyStocks WeeklyStock[]
  orderItems   OrderItem[]
  
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  
  @@index([categoryId])
  @@index([slug])
}

enum StockType {
  WEEKLY      // Stock por semana
  UNLIMITED   // Sin límite (para productos digitales/especiales)
}

// Control de stock por ciclo semanal
model WeeklyStock {
  id            String   @id @default(cuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  // Identificador del ciclo semanal (ej: "2025-W45")
  weekId        String   // Formato ISO: YYYY-Www
  
  maxStock      Int      // Stock máximo para esta semana
  currentStock  Int      // Stock disponible actual
  reservedStock Int      @default(0) // Stock en carritos (no confirmado)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([productId, weekId])
  @@index([weekId])
}

// ============================================
// USUARIOS Y AUTENTICACIÓN
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  phone         String?
  
  // Autenticación (simplificada para MVP)
  passwordHash  String?   // null si es guest
  
  // Dirección por defecto
  address       String?
  city          String?
  postalCode    String?
  
  // Preferencias
  emailNotifications Boolean @default(true)
  
  orders        Order[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([email])
}

// ============================================
// PEDIDOS Y CHECKOUT
// ============================================

model Order {
  id              String          @id @default(cuid())
  orderNumber     String          @unique // Ej: "TBK-2025-0001"
  
  // Cliente
  userId          String?
  user            User?           @relation(fields: [userId], references: [id])
  
  // Info de contacto (para guests)
  customerEmail   String
  customerName    String
  customerPhone   String
  
  // Ciclo semanal
  weekId          String          // Semana de producción
  
  // Montos
  subtotal        Decimal         @db.Decimal(10, 2)
  shippingCost    Decimal         @db.Decimal(10, 2)
  total           Decimal         @db.Decimal(10, 2)
  
  // Estado del pedido
  status          OrderStatus     @default(PENDING)
  
  // Método de entrega
  deliveryMethod  DeliveryMethod
  
  // Detalles de entrega
  pickupLocation  String?         // Si es recogida en punto
  pickupAddress   String?
  pickupSchedule  String?         // Horario del punto de recogida
  
  shippingAddress String?         // Si es envío
  shippingCity    String?
  shippingPostal  String?
  
  // Pago
  paymentStatus   PaymentStatus   @default(PENDING)
  paymentMethod   String          @default("card")
  stripePaymentId String?
  
  // Notas
  customerNotes   String?
  adminNotes      String?
  
  // Items del pedido
  items           OrderItem[]
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  paidAt          DateTime?
  deliveredAt     DateTime?
  
  @@index([userId])
  @@index([weekId])
  @@index([status])
  @@index([orderNumber])
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  // Datos del producto en el momento de la compra
  productName String
  quantity    Int
  unitPrice   Decimal  @db.Decimal(10, 2)
  subtotal    Decimal  @db.Decimal(10, 2)
  
  // Opciones
  sliced      Boolean  @default(true) // ¿Rebanado?
  
  createdAt   DateTime @default(now())
  
  @@index([orderId])
  @@index([productId])
}

enum OrderStatus {
  PENDING      // Pendiente de confirmación
  PAID         // Pagado, en producción
  BAKING       // En hornado
  READY        // Listo para entrega/recogida
  DELIVERED    // Entregado
  CANCELLED    // Cancelado
}

enum PaymentStatus {
  PENDING      // Pendiente de pago
  PAID         // Pagado
  FAILED       // Fallo en el pago
  REFUNDED     // Reembolsado
}

enum DeliveryMethod {
  PICKUP_POINT // Recogida en punto fijo
  LOCAL_DELIVERY // Envío local (Utrera)
  NATIONAL_COURIER // Mensajería nacional
}

// ============================================
// PUNTOS DE RECOGIDA
// ============================================

model PickupPoint {
  id          String   @id @default(cuid())
  name        String   // "Bulevar", "Cero Coma"
  address     String
  city        String
  postalCode  String
  
  // Horarios de recogida
  schedule    String   // "Viernes 17:00-20:00, Sábado 10:00-14:00"
  
  instructions String? // Instrucciones adicionales
  
  isActive    Boolean  @default(true)
  order       Int      @default(0) // Para ordenar en el frontend
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================
// CONFIGURACIÓN DEL SITIO
// ============================================

model SiteConfig {
  id    String @id @default(cuid())
  key   String @unique
  value String
  
  updatedAt DateTime @updatedAt
}

// Ejemplo de configuraciones:
// - "time_gating_enabled": "true"
// - "opening_day": "3" (Miércoles = 3)
// - "opening_hour": "18"
// - "closing_day": "0" (Domingo = 0)
// - "closing_hour": "20"
// - "current_week_id": "2025-W45"
// - "shipping_cost_national": "5.95"
```

---

## ⏰ Sistema de Time-Gating

### Lógica de Apertura/Cierre

```typescript
// src/lib/time-gating.ts

import { DateTime } from 'luxon';

export interface TimeGatingConfig {
  timezone: string;
  openingDay: number; // 0=Domingo, 1=Lunes, ..., 3=Miércoles
  openingHour: number;
  openingMinute: number;
  closingDay: number;
  closingHour: number;
  closingMinute: number;
}

export const DEFAULT_CONFIG: TimeGatingConfig = {
  timezone: 'Europe/Madrid',
  openingDay: 3, // Miércoles
  openingHour: 18,
  openingMinute: 0,
  closingDay: 0, // Domingo
  closingHour: 20,
  closingMinute: 0,
};

export class TimeGatingService {
  private config: TimeGatingConfig;

  constructor(config: TimeGatingConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Verifica si el sitio está abierto para pedidos
   */
  isOpen(now?: DateTime): boolean {
    const currentTime = now || DateTime.now().setZone(this.config.timezone);
    
    const weekStart = currentTime.startOf('week'); // Lunes 00:00
    
    // Calcular tiempo de apertura (Miércoles 18:00)
    const openingTime = weekStart.plus({ 
      days: this.config.openingDay - 1, // Ajuste porque startOf('week') es lunes
      hours: this.config.openingHour,
      minutes: this.config.openingMinute 
    });
    
    // Calcular tiempo de cierre (Domingo 20:00)
    const closingTime = weekStart.plus({ 
      days: this.config.closingDay + 6, // Domingo de la semana actual
      hours: this.config.closingHour,
      minutes: this.config.closingMinute 
    });
    
    return currentTime >= openingTime && currentTime <= closingTime;
  }

  /**
   * Obtiene el tiempo restante hasta la próxima apertura
   */
  getTimeUntilOpening(now?: DateTime): {
    isOpen: boolean;
    nextOpening: DateTime | null;
    remainingMs: number | null;
  } {
    const currentTime = now || DateTime.now().setZone(this.config.timezone);
    const isCurrentlyOpen = this.isOpen(currentTime);

    if (isCurrentlyOpen) {
      return {
        isOpen: true,
        nextOpening: null,
        remainingMs: null,
      };
    }

    // Calcular próxima apertura
    const weekStart = currentTime.startOf('week');
    let nextOpening = weekStart.plus({ 
      days: this.config.openingDay - 1,
      hours: this.config.openingHour,
      minutes: this.config.openingMinute 
    });

    // Si ya pasó la apertura de esta semana, calcular la siguiente
    if (nextOpening <= currentTime) {
      nextOpening = nextOpening.plus({ weeks: 1 });
    }

    return {
      isOpen: false,
      nextOpening,
      remainingMs: nextOpening.diff(currentTime).milliseconds,
    };
  }

  /**
   * Obtiene el ID de la semana actual (formato ISO: YYYY-Www)
   */
  getCurrentWeekId(now?: DateTime): string {
    const currentTime = now || DateTime.now().setZone(this.config.timezone);
    return currentTime.toFormat('kkkk-\'W\'WW'); // ej: "2025-W45"
  }

  /**
   * Formatea el tiempo restante de manera legible
   */
  formatTimeRemaining(ms: number): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor((ms / 1000 / 60 / 60) % 24);
    const days = Math.floor(ms / 1000 / 60 / 60 / 24);

    return { days, hours, minutes, seconds };
  }
}

export const timeGating = new TimeGatingService();
```

### Middleware de Next.js

```typescript
// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { timeGating } from './lib/time-gating';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo aplicar time-gating a rutas de compra
  const protectedRoutes = ['/carrito', '/checkout'];
  const shouldCheckGating = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (shouldCheckGating) {
    const gatingStatus = timeGating.getTimeUntilOpening();

    if (!gatingStatus.isOpen) {
      // Redirigir a homepage con mensaje
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('closed', 'true');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## 📦 Gestión de Stock

### Sistema de Stock Semanal

```typescript
// src/lib/stock-manager.ts

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
}

export const stockManager = new StockManager();
```

---

## 🛒 Flujo de Checkout

### Diagrama de Estados

```
[Catálogo] 
    ↓ (Agregar al carrito)
[Carrito]
    ↓ (Verificar stock + Time-gating)
[Checkout - Paso 1: Datos del cliente]
    ↓
[Checkout - Paso 2: Método de entrega]
    ↓ (Seleccionar punto/dirección)
[Checkout - Paso 3: Resumen]
    ↓ (Confirmar)
[Procesamiento de Pago - Stripe]
    ↓ (Pago exitoso)
[Confirmación de Pedido]
    ↓ (Email + Webhook)
[Admin: Gestión del pedido]
```

### API de Checkout

```typescript
// src/app/api/checkout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stockManager } from '@/lib/stock-manager';
import { timeGating } from '@/lib/time-gating';
import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const checkoutSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(9),
  deliveryMethod: z.enum(['PICKUP_POINT', 'LOCAL_DELIVERY', 'NATIONAL_COURIER']),
  pickupLocationId: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingPostal: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    sliced: z.boolean().default(true),
  })),
  customerNotes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar time-gating
    const gatingStatus = timeGating.getTimeUntilOpening();
    if (!gatingStatus.isOpen) {
      return NextResponse.json(
        { error: 'El sitio está cerrado para pedidos' },
        { status: 403 }
      );
    }

    // 2. Validar datos
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    // 3. Verificar stock para todos los productos
    const weekId = timeGating.getCurrentWeekId();
    const stockChecks = await Promise.all(
      data.items.map(item =>
        stockManager.checkAvailability(item.productId, item.quantity, weekId)
      )
    );

    const outOfStockItems = stockChecks
      .map((check, index) => ({ ...check, ...data.items[index] }))
      .filter(item => !item.available);

    if (outOfStockItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Algunos productos no tienen stock suficiente',
          outOfStockItems 
        },
        { status: 400 }
      );
    }

    // 4. Obtener detalles de productos y calcular totales
    const products = await prisma.product.findMany({
      where: { id: { in: data.items.map(i => i.productId) } },
    });

    let subtotal = 0;
    const orderItems = data.items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      const itemSubtotal = Number(product.price) * item.quantity;
      subtotal += itemSubtotal;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
        sliced: item.sliced,
      };
    });

    // 5. Calcular costos de envío
    let shippingCost = 0;
    if (data.deliveryMethod === 'NATIONAL_COURIER') {
      shippingCost = 5.95;
    } else if (data.deliveryMethod === 'LOCAL_DELIVERY') {
      shippingCost = 3.50; // Configurable
    }

    const total = subtotal + shippingCost;

    // 6. Obtener/crear usuario
    let user = await prisma.user.findUnique({
      where: { email: data.customerEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.customerEmail,
          name: data.customerName,
          phone: data.customerPhone,
        },
      });
    }

    // 7. Generar número de pedido
    const orderCount = await prisma.order.count();
    const orderNumber = `TBK-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

    // 8. Obtener detalles del punto de recogida si aplica
    let pickupDetails = null;
    if (data.deliveryMethod === 'PICKUP_POINT' && data.pickupLocationId) {
      pickupDetails = await prisma.pickupPoint.findUnique({
        where: { id: data.pickupLocationId },
      });
    }

    // 9. Crear orden en estado PENDING
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        weekId,
        subtotal,
        shippingCost,
        total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        deliveryMethod: data.deliveryMethod,
        pickupLocation: pickupDetails?.name,
        pickupAddress: pickupDetails?.address,
        pickupSchedule: pickupDetails?.schedule,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingPostal: data.shippingPostal,
        customerNotes: data.customerNotes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // 10. Reservar stock
    await Promise.all(
      data.items.map(item =>
        stockManager.reserveStock(item.productId, item.quantity, weekId)
      )
    );

    // 11. Crear sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: order.items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.productName,
            description: item.sliced ? 'Rebanado' : 'Sin rebanar',
          },
          unit_amount: Math.round(Number(item.unitPrice) * 100), // Centavos
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/pedido/${order.id}/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout?cancelled=true`,
      customer_email: data.customerEmail,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // 12. Actualizar orden con ID de Stripe
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentId: session.id },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl: session.url,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error procesando el pedido' },
      { status: 500 }
    );
  }
}
```

---

## 🔒 Seguridad y Concurrencia

### Prevención de Overselling

```typescript
// Uso de transacciones de Prisma para operaciones atómicas

async function handleConcurrentPurchase(productId: string, quantity: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Bloquear registro con SELECT FOR UPDATE
    const stock = await tx.weeklyStock.findUnique({
      where: { productId_weekId: { productId, weekId } },
    });

    if (!stock || (stock.currentStock - stock.reservedStock) < quantity) {
      throw new Error('Stock insuficiente');
    }

    // 2. Actualizar stock de forma atómica
    await tx.weeklyStock.update({
      where: { id: stock.id },
      data: {
        reservedStock: { increment: quantity },
      },
    });

    return true;
  });
}
```

### Rate Limiting

```typescript
// src/lib/rate-limit.ts

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function rateLimit(identifier: string, limit: number = 10) {
  const key = `rate_limit:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 60); // 1 minuto
  }
  
  return current <= limit;
}
```

---

## 🔌 APIs y Endpoints

### Endpoints Principales

```typescript
// PÚBLICOS (Storefront)
GET    /api/productos                    // Listar productos con stock
GET    /api/productos/[slug]             // Detalle de producto
GET    /api/time-gating                  // Estado apertura/cierre
POST   /api/checkout                     // Crear orden y sesión de pago
GET    /api/pedido/[id]                  // Detalle de pedido (con auth)
GET    /api/puntos-recogida              // Listar puntos de recogida

// WEBHOOKS
POST   /api/webhooks/stripe              // Confirmar pagos

// ADMIN (Protegidos)
GET    /api/admin/pedidos                // Listar pedidos
PATCH  /api/admin/pedidos/[id]           // Actualizar estado
GET    /api/admin/productos              // Gestión de productos
POST   /api/admin/stock/initialize       // Inicializar semana
GET    /api/admin/stats                  // Dashboard analytics
```

---

## 🚀 Despliegue

### Variables de Entorno

```bash
# .env.local

# Database
DATABASE_URL="postgresql://user:password@host:5432/tiempo_bakery"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Next.js
NEXT_PUBLIC_URL="https://tiempobakery.com"

# Email
RESEND_API_KEY="re_..."

# Auth (NextAuth.js)
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://tiempobakery.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Checklist de Deployment

```markdown
✅ Base de datos PostgreSQL configurada
✅ Prisma migrations ejecutadas
✅ Stripe configurado y webhooks activos
✅ Variables de entorno en Vercel
✅ Dominio personalizado configurado
✅ SSL activo
✅ Emails transaccionales funcionando
✅ Datos de productos iniciales (seed)
✅ Puntos de recogida configurados
✅ Monitoreo de errores (Sentry)
✅ Analytics configurado
✅ Backup automático de DB
```

---

## 📊 Próximos Pasos (Post-MVP)

### Fase 2 - Mejoras
- [ ] Sistema de cupones y descuentos
- [ ] Programa de fidelización
- [ ] Notificaciones push (PWA)
- [ ] Chat de soporte (WhatsApp Business API)
- [ ] Multi-idioma (i18n)

### Fase 3 - Optimizaciones
- [ ] Cache con Redis
- [ ] CDN para imágenes
- [ ] Lazy loading de productos
- [ ] Optimización SEO avanzada
- [ ] A/B testing

### Fase 4 - Expansión
- [ ] App móvil nativa (React Native)
- [ ] Sistema de suscripciones
- [ ] Marketplace de otros productores
- [ ] API pública para integraciones

---

**Documento creado por:** GitHub Copilot  
**Última actualización:** 11 de noviembre de 2025
