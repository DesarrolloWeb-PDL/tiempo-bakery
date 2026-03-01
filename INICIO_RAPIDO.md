# 🚀 Guía de Inicio Rápido - Tiempo Bakery

Esta guía te ayudará a poner en marcha el proyecto en **menos de 10 minutos**.

---

## 📝 Resumen de lo que hemos implementado

### ✅ Fase 1: MVP Básico (Completado)

1. **Base de datos**: Schema completo con Prisma
2. **APIs REST**:
   - `/api/productos` - Listado de productos con stock
   - `/api/productos/[slug]` - Detalle de producto
   - `/api/time-gating` - Estado de apertura/cierre
   - `/api/puntos-recogida` - Puntos de recogida
3. **Frontend**:
   - Catálogo de productos con filtros por categoría
   - Tarjetas de producto con información de stock
   - Sistema de time-gating con banner informativo
   - Header con contador de carrito
   - Footer informativo
4. **Carrito de compras**:
   - Store de Zustand con persistencia en localStorage
   - Panel deslizable lateral (cart sidebar)
   - Agregar/quitar productos
   - Ajustar cantidades
   - Opción de rebanado
5. **Componentes UI**: Button, Card, Badge, Input, Textarea
6. **Lógica de negocio**:
   - Sistema de time-gating (apertura/cierre)
   - Gestión de stock semanal
   - Reserva de stock

### ✅ Fase 2: Checkout y Pagos (Completado)

1. **Checkout multi-paso**:
   - Paso 1: Información del cliente
   - Paso 2: Método de entrega (recogida/envío local/nacional)
   - Paso 3: Revisión del pedido
2. **APIs de checkout**:
   - `/api/checkout` - Procesamiento de pedidos con Stripe
   - `/api/pedidos/[id]` - Obtener detalles de pedido
   - `/api/webhooks/stripe` - Webhook para confirmación de pagos
3. **Integración Stripe**:
   - Sesiones de checkout
   - Webhooks para eventos de pago
   - Tarjetas de test incluidas
4. **Página de confirmación**:
   - `/pedido/[id]/confirmacion` - Confirmación visual del pedido
   - Resumen completo del pedido
   - Información de entrega

### ⏳ Pendiente (Fase 3)

- Emails de confirmación (Resend/SendGrid)
- Panel de administración
- Tests automatizados
- Deploy a producción

---

## 🛠️ Paso 1: Configurar Base de Datos

### Opción A: PostgreSQL Local (Rápido para desarrollo)

1. **Instalar PostgreSQL** (si no lo tienes):
   - Windows: [Descargar desde postgresql.org](https://www.postgresql.org/download/windows/)
   - O usar Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

2. **Crear la base de datos**:
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE tiempo_bakery;

# Salir
\q
```

3. **Editar `.env.local`**:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/tiempo_bakery?schema=public"
```

### Opción B: Vercel Postgres (Para deploy)

1. Ve a [vercel.com](https://vercel.com)
2. Crea tu proyecto
3. Ve a **Storage** > **Create Database** > **Postgres**
4. Copia el `DATABASE_URL` que te proporciona
5. Pégalo en `.env.local`

### Opción C: Supabase (Gratis hasta 500MB)

1. Ve a [supabase.com](https://supabase.com)
2. Crea un proyecto nuevo
3. Ve a **Settings** > **Database** > **Connection string (URI)**
4. Copia la URL (reemplaza `[YOUR-PASSWORD]` con tu contraseña)
5. Pégala en `.env.local`

---

## 🎯 Paso 2: Instalar y Ejecutar

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente de Prisma
npm run db:generate

# 3. Ejecutar migraciones (crear tablas)
npm run db:migrate

# 4. Cargar datos de ejemplo (productos, categorías, puntos de recogida)
npm run db:seed

# 5. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

---

## 💳 Paso 3: Configurar Stripe (Opcional para checkout)

Si quieres probar el flujo completo de checkout y pagos:

### 1. Crear cuenta en Stripe

1. Ve a [stripe.com](https://stripe.com) y crea una cuenta
2. Activa el **modo test** (toggle en la esquina superior derecha)
3. Ve a **Developers** > **API keys**
4. Copia las claves de test

### 2. Configurar variables de entorno

Agrega a tu `.env.local`:

```bash
# Stripe (claves de TEST, no de producción)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# URL de tu aplicación
NEXT_PUBLIC_URL=http://localhost:3000
```

### 3. Configurar webhook local

Para recibir eventos de Stripe en local:

```bash
# Instalar Stripe CLI
# Windows: choco install stripe-cli
# Mac: brew install stripe/stripe-cli/stripe

# Login en Stripe
stripe login

# Escuchar webhooks (mantén esta terminal abierta)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copia el **webhook signing secret** que aparece (empieza con `whsec_`) y agrégalo a `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

Ahora reinicia el servidor de desarrollo:

```bash
npm run dev
```

---

## 🧪 Paso 4: Probar el Sistema

### Ver productos
- Ve a la página principal: muestra el catálogo
- Los productos están agrupados por categorías
- Cada producto muestra su stock disponible

### Probar el carrito
1. Haz clic en "Agregar al carrito" en cualquier producto
2. Se abrirá el panel del carrito automáticamente
3. Prueba:
   - Aumentar/disminuir cantidad
   - Marcar/desmarcar "rebanado"
   - Eliminar productos
   - El carrito se mantiene aunque refresques la página (localStorage)

### Ver productos en Prisma Studio
```bash
npm run db:studio
```
- Se abre en `http://localhost:5555`
- Puedes ver todos los datos de la BD
- Editar productos, stock, etc.

### Probar el checkout completo (si configuraste Stripe)

1. **Agregar productos al carrito**:
   - Haz clic en "Agregar al carrito" en 2-3 productos
   - Verifica que se abra el sidebar del carrito
   - Ajusta cantidades si quieres

2. **Ir al checkout**:
   - Haz clic en "Finalizar Compra" en el carrito
   - Serás redirigido a `/checkout`

3. **Paso 1 - Información del cliente**:
   - Nombre: "Usuario de Prueba"
   - Email: "test@test.com"
   - Teléfono: "666777888"
   - Clic en "Continuar"

4. **Paso 2 - Método de entrega**:
   - **Opción A**: Selecciona "Recogida en punto" (gratis)
     - Elige un punto del dropdown
   - **Opción B**: Selecciona "Envío local" (5€)
     - Dirección: "Calle Test 123"
     - Ciudad: "Barcelona"  
     - CP: "08001"
   - Clic en "Continuar"

5. **Paso 3 - Revisión**:
   - Verifica que todo sea correcto
   - (Opcional) Agrega notas
   - Clic en "Proceder al pago"

6. **Stripe Checkout**:
   - Tarjeta: `4242 4242 4242 4242`
   - Fecha: cualquier fecha futura (ej: 12/25)
   - CVC: cualquier 3 dígitos (ej: 123)
   - Nombre: cualquier nombre
   - Clic en "Pay"

7. **Página de confirmación**:
   - Deberías ver el mensaje de éxito ✅
   - Número de pedido (TBK-2024-XXXX)
   - Resumen completo del pedido
   - Estado: PAID

8. **Verificar en la base de datos**:
   - Abre Prisma Studio: `npm run db:studio`
   - Ve a la tabla `Order`
   - Deberías ver tu pedido con status PAID
   - Verifica también `OrderItem` y `WeeklyStock`

### Tarjetas de test de Stripe

| Número | Resultado |
|--------|-----------|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0000 0000 9995` | ❌ Fondos insuficientes |
| `4000 0000 0000 0002` | ❌ Tarjeta declinada |

### Probar las APIs

**Listar productos:**
```bash
curl http://localhost:3000/api/productos
```

**Ver estado de time-gating:**
```bash
curl http://localhost:3000/api/time-gating
```

**Detalle de un producto:**
```bash
curl http://localhost:3000/api/productos/pan-espelta-integral
```

---

## 🔧 Paso 4: Personalizar

### Cambiar productos
Edita `prisma/seed.ts` y ejecuta:
```bash
npm run db:seed
```

### Cambiar horarios de apertura
Edita `src/lib/time-gating.ts`:
```typescript
export const DEFAULT_CONFIG: TimeGatingConfig = {
  timezone: 'Europe/Madrid',
  openingDay: 3,      // 3 = Miércoles
  openingHour: 18,    // 18:00
  openingMinute: 0,
  closingDay: 0,      // 0 = Domingo
  closingHour: 20,    // 20:00
  closingMinute: 0,
};
```

### Agregar imágenes de productos

Por ahora, los productos tienen URLs de placeholder. Para agregar imágenes reales:

1. **Opción temporal**: Usar URLs externas (Imgur, Unsplash, etc.)
2. **Opción local**: Poner imágenes en `public/images/productos/`
3. **Opción producción**: Configurar Vercel Blob

Luego ejecuta:
```bash
npm run db:studio
```
Y edita el campo `imageUrl` de cada producto.

---

## 📦 Estructura de Archivos Creados

```
src/
├── app/
│   ├── api/
│   │   ├── productos/
│   │   │   ├── route.ts                 # GET /api/productos
│   │   │   └── [slug]/route.ts          # GET /api/productos/:slug
│   │   ├── pedidos/
│   │   │   └── [id]/route.ts            # GET /api/pedidos/:id
│   │   ├── checkout/route.ts            # POST /api/checkout
│   │   ├── time-gating/route.ts         # GET /api/time-gating
│   │   ├── puntos-recogida/route.ts     # GET /api/puntos-recogida
│   │   └── webhooks/
│   │       └── stripe/route.ts          # POST /api/webhooks/stripe
│   ├── checkout/
│   │   └── page.tsx                     # Página de checkout multi-paso
│   ├── pedido/
│   │   └── [id]/
│   │       └── confirmacion/
│   │           └── page.tsx             # Página de confirmación
│   ├── layout.tsx                       # Layout con Header + Footer + Cart
│   └── page.tsx                         # Homepage con catálogo
├── components/
│   ├── ui/                              # Componentes base
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   └── textarea.tsx
│   ├── checkout/                        # Componentes de checkout
│   │   ├── customer-info-step.tsx       # Paso 1: Info del cliente
│   │   ├── delivery-step.tsx            # Paso 2: Método de entrega
│   │   └── review-step.tsx              # Paso 3: Revisión
│   ├── productos/
│   │   ├── product-card.tsx             # Tarjeta de producto
│   │   └── add-to-cart-button.tsx       # Botón agregar al carrito
│   ├── header.tsx                       # Header con logo + carrito
│   ├── footer.tsx                       # Footer informativo
│   ├── cart-sidebar.tsx                 # Panel deslizable del carrito
│   └── time-gating-banner.tsx           # Banner de apertura/cierre
├── stores/
│   └── cart-store.ts                    # Zustand store del carrito
├── types/
│   ├── cart.ts                          # TypeScript types del carrito
│   └── checkout.ts                      # TypeScript types del checkout
└── lib/
    ├── db.ts                            # Cliente de Prisma
    ├── time-gating.ts                   # Lógica de apertura/cierre
    ├── stock-manager.ts                 # Gestión de stock
    └── utils.ts                         # Utilidades (cn, etc.)
```

---

## 🚨 Solución de Problemas

### Error: "Cannot find module '@prisma/client'"
```bash
npm run db:generate
```

### Error: "relation does not exist"
```bash
npm run db:migrate
```

### El carrito no se mantiene
- Verifica que el componente use `'use client'` en la parte superior
- Revisa la consola del navegador por errores
- Borra el localStorage: `localStorage.clear()`

### Los productos no se muestran
1. Verifica que la base de datos tenga datos: `npm run db:studio`
2. Si está vacía: `npm run db:seed`
3. Verifica que `NEXT_PUBLIC_URL` esté en `.env.local`

### Error de conexión a la base de datos
- Verifica que PostgreSQL esté corriendo
- Verifica que `DATABASE_URL` sea correcta
- Para servicios cloud, asegúrate de agregar `?sslmode=require` al final

---

## 🎨 Próximos Pasos Recomendados

1. **Testing exhaustivo**:
   - Probar todos los casos de edge del checkout
   - Verificar comportamiento de webhooks
   - Probar diferentes métodos de pago

2. **Emails de Confirmación**:
   - Integrar Resend o SendGrid
   - Template HTML de confirmación
   - Notificaciones de cambio de estado
   - Email al administrador cuando hay nuevo pedido

3. **Panel de Administración**:
   - Dashboard con stats de pedidos
   - Lista de pedidos con filtros
   - Cambiar estado de pedidos
   - Gestionar stock semanal manualmente
   - Exportar pedidos a CSV/Excel

4. **Mejoras de UX**:
   - Loading states mejorados
   - Animaciones de transición
   - Notificaciones toast
   - Búsqueda de productos
   - Filtros avanzados

5. **Deploy a Producción**:
   - Sigue la guía [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)
   - Configura dominio personalizado
   - Habilita Analytics
   - Configura monitoreo de errores (Sentry)

---

## 📚 Recursos

- **Documentación completa**:
  - [ARQUITECTURA.md](ARQUITECTURA.md) - Arquitectura completa del sistema
  - [IMPLEMENTACION_FASE1.md](IMPLEMENTACION_FASE1.md) - Detalles de Fase 1
  - [IMPLEMENTACION_FASE2.md](IMPLEMENTACION_FASE2.md) - Detalles de Fase 2 (Checkout)
  - [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) - Guía de despliegue en Vercel
  - [COMANDOS.md](COMANDOS.md) - Referencia de comandos útiles
- **Tecnologías**:
  - [Prisma](https://www.prisma.io/docs) - ORM
  - [Next.js](https://nextjs.org/docs) - Framework
  - [Zustand](https://docs.pmnd.rs/zustand) - State management
  - [Stripe](https://stripe.com/docs) - Pagos
  - [Tailwind CSS](https://tailwindcss.com/docs) - Estilos

---

## 💡 Consejos

- **Usa Prisma Studio** para ver y editar datos fácilmente: `npm run db:studio`
- **Revisa los logs** de desarrollo para errores de API
- **El time-gating** está configurado para Miércoles 18:00 - Domingo 20:00. Puedes cambiar esto en `src/lib/time-gating.ts`
- **El carrito se guarda** en localStorage, así que sobrevive recargas de página
- **Para reset del carrito**, abre la consola del navegador y ejecuta: `localStorage.clear()`

---

¡Disfruta construyendo tu e-commerce de panadería artesanal! 🥖✨
