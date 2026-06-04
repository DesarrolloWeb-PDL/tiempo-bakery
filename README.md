# 🥖 Tiempo Bakery - E-commerce de Panadería Artesanal

Sistema de e-commerce especializado para micropanadería artesanal con modelo de preventa semanal y control de stock por lotes.

## ✅ Estado del Proyecto

**Fase 1 (MVP Básico)**: ✅ Completada  
**Fase 2 (Checkout y Pagos)**: ✅ Completada  
**Fase 3 (Operación y Admin)**: 🟡 En curso, con piezas principales implementadas

El proyecto está **funcional** con catálogo de productos, carrito de compras, checkout multi-paso, integración con Stripe y Mercado Pago, panel admin protegido, uploads de imágenes y emails transaccionales opcionales vía Resend.

## ✨ Características Implementadas

- ✅ **⏰ Time-Gating**: Apertura/cierre automático de pedidos (Miércoles 18:00 - Domingo 20:00)
- ✅ **📦 Stock Semanal**: Control de inventario por ciclo de producción
- ✅ **🛒 Carrito Inteligente**: Persistencia en localStorage con ajuste de cantidades
- ✅ **🚚 Múltiples Entregas**: Recogida en punto, envío local (5€) y nacional (10€)
- ✅ **💳 Pago Seguro**: Integración completa con Stripe y Mercado Pago (checkout + webhooks)
- ✅ **🧾 Gestión de Pedidos**: Creación automática con número único (TBK-YYYY-NNNN)
- ✅ **📄 Página de Confirmación**: Resumen completo del pedido postpago
- ✅ **📧 Emails Transaccionales**: Confirmación opcional al cliente y aviso interno con Resend
- ✅ **👨‍💼 Panel Admin**: Login protegido, métricas, productos, stock, pedidos, configuración y uploads
- ✅ **🔒 Seguridad Base**: Middleware con headers HTTP de seguridad y rate limiting en login admin y checkout

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Estado**: Zustand
- **Validación**: Zod
- **Pagos**: Stripe + Mercado Pago
- **Emails**: Resend (opcional)
- **Fecha/Hora**: Luxon

## 📋 Requisitos Previos

- Node.js 20.x o superior
- PostgreSQL 14+ (o cuenta en Supabase/Railway)
- Cuenta de Stripe y/o Mercado Pago (modo test para desarrollo)
- npm o yarn

## 🚀 Instalación

### 1. Clonar e instalar dependencias

```bash
# Clonar el repositorio
git clone <tu-repo>
cd tiempo_backery

# Instalar dependencias
npm install
```

### 2. Configurar base de datos

Puedes usar PostgreSQL local o un servicio en la nube:

**Opción A: PostgreSQL Local**
```bash
# Crear base de datos
createdb tiempo_bakery
```

**Opción B: Supabase (Recomendado para desarrollo)**
1. Crear cuenta en [Supabase](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar la connection string de PostgreSQL

**Opción C: Railway**
1. Crear cuenta en [Railway](https://railway.app)
2. Crear nuevo proyecto PostgreSQL
3. Copiar la connection string

### 3. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo para Next.js y Prisma CLI
copy .env.example .env.local
```

Configuración mínima necesaria:

```env
# Base de datos
# Si usás Prisma Accelerate en producción, mantené ambas URLs también en local.
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
DIRECT_URL="postgres://usuario:password@host:5432/tiempo_bakery?sslmode=require"

# Stripe (usar claves de test)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Dejar vacío por ahora

# Mercado Pago (opcional, si lo vas a habilitar)
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."

# Admin
ADMIN_PASSWORD="una_clave_larga_y_unica"
JWT_SECRET="un_secreto_largo_y_unico"

# Emails transaccionales (opcional)
RESEND_API_KEY="re_..."
ORDER_EMAIL_FROM="Tiempo Bakery <onboarding@resend.dev>"
ORDER_NOTIFICATION_EMAILS="pedidos@tiempobakery.com"

# URL del sitio
NEXT_PUBLIC_URL="http://localhost:3000"
```

### 4. Inicializar base de datos

```bash
# Generar cliente de Prisma
npm run db:generate

# Aplicar migraciones (crear tablas)
npm run db:migrate

# Poblar con datos de ejemplo
npm run db:seed
```

### 5. Configurar Stripe para checkout

Para probar el flujo completo de pago:

```bash
# Instalar Stripe CLI
# Windows: choco install stripe-cli
# Mac: brew install stripe/stripe-cli/stripe
# Linux: Ver https://stripe.com/docs/stripe-cli

# Login
stripe login

# Escuchar webhooks (mantener terminal abierta)
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copiar el **webhook signing secret** que aparece y agregarlo a `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 6. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🧪 Probar el Flujo Completo

1. **Agregar productos al carrito** en la homepage
2. **Hacer checkout** (clic en el botón del carrito)
3. **Completar formulario** de checkout (3 pasos)
4. **Pagar con Stripe o Mercado Pago** según la configuración activa
5. **Ver página de confirmación** con el resumen del pedido
6. **Verificar en Prisma Studio**: `npm run db:studio`
7. **Si configuraste Resend**, comprobar que el webhook dispare la confirmación por email

📖 **Ver guía detallada**: [INICIO_RAPIDO.md](INICIO_RAPIDO.md)

## 📚 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Compilar para producción
npm run start            # Iniciar servidor de producción
npm run lint             # Ejecutar linter
npm run test             # Ejecutar suite de Vitest
npm run verify:predeploy # Typecheck + chequeos previos a deploy

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:push          # Sincronizar schema (desarrollo)
npm run db:migrate       # Crear migración
npm run db:studio        # Abrir Prisma Studio (UI de BD)
npm run db:seed          # Poblar con datos de ejemplo
```

## 🗄️ Estructura del Proyecto

```
tiempo_backery/
├── prisma/
│   ├── schema.prisma          # Modelo de datos
│   ├── seed.ts               # Datos iniciales
│   └── migrations/           # Migraciones de BD
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── productos/    # API de productos
│   │   │   ├── pedidos/      # API de pedidos
│   │   │   ├── checkout/     # API de checkout
│   │   │   ├── webhooks/     # Webhooks (Stripe)
│   │   │   ├── time-gating/  # API de time-gating
│   │   │   └── puntos-recogida/ # API de puntos
│   │   ├── checkout/
│   │   │   └── page.tsx      # Página de checkout
│   │   ├── pedido/
│   │   │   └── [id]/
│   │   │       └── confirmacion/ # Confirmación de pedido
│   │   ├── layout.tsx        # Layout raíz
│   │   ├── page.tsx          # Homepage
│   │   └── globals.css       # Estilos globales
│   ├── components/
│   │   ├── ui/              # Componentes base (shadcn/ui)
│   │   ├── checkout/        # Componentes de checkout
│   │   ├── productos/       # Componentes de productos
│   │   ├── header.tsx       # Header con carrito
│   │   ├── footer.tsx       # Footer
│   │   ├── cart-sidebar.tsx # Carrito lateral
│   │   └── time-gating-banner.tsx # Banner de horarios
│   ├── lib/
│   │   ├── db.ts            # Cliente Prisma
│   │   ├── time-gating.ts   # Time-gating service
│   │   ├── stock-manager.ts # Stock manager
│   │   └── utils.ts         # Utilidades
│   ├── stores/
│   │   └── cart-store.ts    # Store del carrito (Zustand)
│   └── types/
│       ├── cart.ts          # Types del carrito
│       └── checkout.ts      # Types del checkout
├── public/                   # Archivos estáticos
├── docs/
│   ├── ARQUITECTURA.md      # Arquitectura del sistema
│   ├── INICIO_RAPIDO.md     # Guía de inicio rápido
│   ├── IMPLEMENTACION_FASE1.md # Documentación Fase 1
│   ├── IMPLEMENTACION_FASE2.md # Documentación Fase 2
│   ├── VERCEL_DEPLOY.md     # Guía de despliegue
│   └── COMANDOS.md          # Referencia de comandos
└── package.json
```

## 🔧 Configuración de Stripe

### 1. Crear cuenta de Stripe

1. Registrarse en [Stripe](https://stripe.com)
2. Activar "Modo de prueba" (toggle en la esquina superior)
3. Ir a Developers > API Keys
4. Copiar "Publishable key" y "Secret key"

### 2. Configurar Webhooks (Opcional para MVP)

Para recibir confirmaciones de pago:

1. En Stripe Dashboard: Developers > Webhooks
2. Agregar endpoint: `https://tu-dominio.com/api/webhooks/stripe`
3. Seleccionar eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copiar "Signing secret" a `STRIPE_WEBHOOK_SECRET`

Para desarrollo local, usar Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 🎨 Personalización

### Modificar horarios de apertura/cierre

Editar `src/lib/time-gating.ts`:

```typescript
export const DEFAULT_CONFIG: TimeGatingConfig = {
  timezone: 'Europe/Madrid',
  openingDay: 3,    // 0=Domingo, 3=Miércoles
  openingHour: 18,
  openingMinute: 0,
  closingDay: 0,    // Domingo
  closingHour: 20,
  closingMinute: 0,
};
```

### Agregar productos

```bash
# Opción 1: Usar Prisma Studio (UI visual)
npm run db:studio

# Opción 2: Editar prisma/seed.ts y re-ejecutar
npm run db:seed
```

### Cambiar colores del tema

Editar `src/app/globals.css`:

```css
:root {
  --primary: 24 9.8% 10%;  /* Color principal */
  --accent: 60 4.8% 95.9%;  /* Color de acento */
  /* ... más colores */
}
```

## 📖 Documentación Completa

Este proyecto incluye documentación exhaustiva:

- **[INICIO_RAPIDO.md](./INICIO_RAPIDO.md)**: Guía de inicio en 10 minutos
  - Instalación paso a paso
  - Configuración de Stripe, Mercado Pago y Resend
  - Testing del flujo completo
  - Solución de problemas comunes

- **[ARQUITECTURA.md](./ARQUITECTURA.md)**: Diseño completo del sistema
  - Modelo de datos con diagramas
  - Flujos de trabajo detallados
  - APIs y endpoints
  - Decisiones técnicas

- **[IMPLEMENTACION_FASE1.md](./IMPLEMENTACION_FASE1.md)**: Documentación de Fase 1
  - Catálogo de productos
  - Sistema de carrito
  - APIs REST
  - Componentes UI

- **[IMPLEMENTACION_FASE2.md](./IMPLEMENTACION_FASE2.md)**: Documentación de Fase 2
  - Checkout multi-paso
  - Integración con Stripe
  - Webhooks
  - Confirmación de pedidos
  - Testing exhaustivo

- **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)**: Guía de despliegue en Vercel
  - Configuración de base de datos
  - Variables de entorno
  - Webhooks de Stripe y Mercado Pago en producción
  - Troubleshooting

- **[COMANDOS.md](./COMANDOS.md)**: Referencia rápida de comandos
  - Scripts de npm
  - Comandos de Prisma
  - Utilidades operativas y chequeos de despliegue

## 🚀 Despliegue a Producción

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en Vercel Dashboard
```

### Railway

1. Conectar repositorio de GitHub
2. Agregar servicio PostgreSQL
3. Configurar variables de entorno
4. Desplegar automáticamente

## 🐛 Solución de Problemas

### Error: "Cannot find module '@prisma/client'"

```bash
npm run db:generate
```

### Error de conexión a PostgreSQL

Verificar:
- PostgreSQL está corriendo
- Credenciales en `.env` son correctas
- Puerto 5432 está disponible

### Stock no se actualiza

```bash
# Re-inicializar stock de la semana actual
npm run db:studio
# Borrar registros de WeeklyStock y ejecutar en la app
```

### Time-gating no funciona correctamente

Verificar zona horaria del servidor:
```typescript
// En src/lib/time-gating.ts
timezone: 'Europe/Madrid'  // Ajustar según tu ubicación
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Roadmap

### ✅ Fase 1: MVP Básico (Completada)
- [x] Configuración inicial del proyecto
- [x] Modelo de datos completo
- [x] Sistema de time-gating
- [x] Gestión de stock semanal
- [x] Catálogo de productos con filtros
- [x] Carrito de compras con persistencia
- [x] APIs REST (productos, time-gating, puntos)
- [x] Componentes UI base (shadcn/ui)
- [x] Header, Footer, Cart Sidebar

### ✅ Fase 2: Checkout y Pagos (Completada)
- [x] Formulario de checkout multi-paso
- [x] Integración con Stripe (checkout + webhooks)
- [x] Validación de datos con Zod
- [x] API de checkout con gestión de stock
- [x] Página de confirmación de pedido
- [x] Gestión automática de estados de pedido

### 🟡 Fase 3: Operación y Administración (En curso)
- [x] Integración opcional con Resend para confirmación al cliente y aviso interno
- [x] Template HTML de confirmación de pedido pagado
- [x] Panel de administración con autenticación por cookie firmada
- [x] Dashboard con métricas, pedidos, productos, stock y configuración
- [x] Uploads admin con fallback local y soporte para storage persistente
- [ ] Notificaciones adicionales por cambio de estado
- [ ] Exportación de pedidos (CSV/Excel)
- [ ] Rate limiting distribuido para despliegues multi-instancia

### 🚀 Fase 4: Optimización y Producción (Futura)
- [ ] Más cobertura automatizada en checkout, stock-manager y time-gating
- [ ] Optimización de imágenes
- [ ] Mejoras de SEO (metadata, sitemap)
- [ ] Analytics (Vercel Analytics / Google Analytics)
- [ ] Monitoreo de errores (Sentry)
- [ ] Sistema de reviews de productos
- [ ] Programa de fidelización
- [ ] App móvil (React Native / PWA)

## 📄 Licencia

Este proyecto es privado y propietario.

## 👥 Contacto

Para soporte o consultas: [tu-email@ejemplo.com]

---

**Desarrollado con ❤️ y masa madre 🥖**
