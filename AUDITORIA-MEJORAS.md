# Auditoría de Mejoras — Tiempo Bakery

> Análisis de código realizado 2026-08-06. Priorizado por severidad.

---

## 🔴 P0 — CRÍTICO (Seguridad — resolver YA)

### 1. Fuga de datos de pedidos sin autenticación

**Archivo:** `src/app/api/pedidos/[id]/route.ts`

`GET /api/pedidos/[id]` no tiene autenticación ni autorización. Cualquiera que adivine o enumere un ID de pedido puede leer nombre, email, teléfono, dirección completa y método de pago del cliente. El formato `TBK-YYYY-XXXXXX` es visible en la UI, haciendo la enumeración trivial.

**Fix:** Validar que el solicitante sea el dueño del pedido (matchear email) o un admin. Como mínimo, requerir cookie de sesión o token de confirmación.

---

### 2. Comparaciones de secretos vulnerables a timing attacks

**Archivos:**
- `src/app/api/admin/login/route.ts` (línea 25)
- `src/lib/admin-auth.ts` (línea 204)
- `src/lib/admin-auth-edge.ts` (línea 142)

```ts
// ❌ Actual — vulnerable
if (!password || password !== adminPassword)

// ✅ Fix
import { timingSafeEqual } from 'crypto'
const match = timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword))
```

---

### 3. CSP demasiado permisivo

**Archivo:** `src/lib/security-headers.ts`

```ts
// ❌ Actual — anula gran parte del CSP
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live"

// ✅ Fix — migrar a nonce-based o hash-based allowlisting
// Usar next/script strategy="afterInteractive" para eliminar inline scripts
```

---

## 🟠 P1 — ALTO (Calidad y arquitectura)

### 4. `formatCurrency` copiado 12 veces

La misma función está duplicada en 12 archivos. Crear `src/lib/format.ts` con una única implementación e importarla en todos lados.

**Archivos afectados:**
- `src/components/cart-sidebar.tsx`
- `src/components/productos/product-card.tsx`
- `src/components/checkout/review-step.tsx`
- `src/components/checkout/delivery-step.tsx`
- `src/app/admin/productos/page.tsx`
- `src/app/admin/pedidos/page.tsx`
- `src/app/admin/pedidos/[id]/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/configuracion/page.tsx`
- `src/app/checkout/page.tsx`
- `src/app/pedido/[id]/confirmacion/page.tsx`
- `src/lib/order-email.ts`

---

### 5. Módulos duplicados (~200 líneas)

- `src/lib/rate-limit.ts` y `src/lib/rate-limit-edge.ts` comparten lógica de fallback casi idéntica (~70 líneas).
- `src/lib/admin-auth.ts` y `src/lib/admin-auth-edge.ts` comparten ~120 líneas (base64url, parsing de payload, derivación de key, verificación de firma).

**Fix:** Extraer funciones puras compartidas a módulos core (`admin-auth-core.ts`, `rate-limit-core.ts`) que ambos importen.

---

### 6. God Component — admin/productos de 1103 líneas

**Archivo:** `src/app/admin/productos/page.tsx`

Este archivo contiene:
- Tabla de listado de productos
- Formulario de crear/editar (30+ campos)
- Modal de CRUD de categorías con form inline
- Lógica de upload de imágenes con preview
- Auto-generación de slug
- Validación inline
- 20+ hooks `useState`

**Fix:** Separar en:
- `ProductList` — renderizado de tabla
- `ProductForm` — formulario crear/editar
- `CategoryManager` — modal de categorías
- Custom hooks: `useProductForm`, `useImageUpload`

---

### 7. Tipos `any` en producción

- `src/app/api/productos/route.ts` línea 23: `const whereClause: any = { ... }`
- `src/app/api/admin/productos/route.ts` líneas 117-118: `let products: any[]`, `let categories: any[]`

**Fix:** Usar `Prisma.ProductWhereInput` para el where clause. Tipar arrays con tipos de Prisma o interfaces explícitas.

---

### 8. Schemas Zod duplicados e inconsistentes

`src/types/checkout.ts` define `checkoutSchema`, pero `src/app/api/checkout/route.ts` define un **schema completamente distinto** con nombres de campos diferentes (`customerEmail` vs `email`, `deliveryMethod` vs `method`).

**Fix:** Usar un único schema compartido. Reconciliar las diferencias entre ambos.

---

## 🟡 P2 — MEDIO (Performance)

### 9. N+1 queries en stock-manager

**Archivo:** `src/lib/stock-manager.ts` — `resyncWeeklyStock` (líneas 56-111)

Hace `findMany` para obtener todos los productos, luego itera con `findUnique` + `create`/`update` individual por cada producto. Con 50 productos son 50+ round-trips secuenciales a la DB.

**Fix:** Usar `upsertMany` o `createMany` con manejo de conflictos, o batchear con `Promise.all` + transacciones.

---

### 10. Side-effect writes en GET handler de admin

**Archivo:** `src/app/api/admin/productos/route.ts` (líneas 172-230)

El handler GET escribe silenciosamente en la DB en cada request: normaliza valores de `imageUrl` y backfillea entries faltantes de image bank. Violación de semántica HTTP y agrega latencia.

**Fix:** Mover lógica de migración/repair a un background job o endpoint admin dedicado.

---

### 11. DB call en cada auth check

**Archivo:** `src/lib/admin-auth.ts` — `hasAdminSession` (líneas 223-237)

Ejecuta `findUnique` sobre `adminSession` por cada request autenticada through el middleware. La versión edge lo salta, pero la Node.js no.

**Fix:** Considerar cache con TTL corto, o aceptar la verificación solo en la ruta edge del middleware.

---

### 12. Cart items sin memoización

**Archivo:** `src/components/cart-sidebar.tsx`

El componente re-renderiza la lista completa de items en cada cambio del store. Las filas individuales `CartItem` no están envueltas en `React.memo`.

**Fix:** Extraer `CartItem` como componente memoizado. Usar `useShallow` de Zustand para seleccionar solo los campos necesarios.

---

## 🔵 P3 — TESTING

### 13. Cero tests de componentes o páginas

Los 12 archivos de test cubren solo `src/lib/` y API routes. No hay tests para:
- Ningún componente React
- Ninguna página (admin o pública)
- El store de Zustand del carrito
- El flujo completo de checkout
- Los componentes UI de time-gating

**Fix mínimo:** Tests para lógica del cart store, validación de formularios de checkout, y flujo CRUD de admin productos.

---

### 14. Gap de integration tests

`tests/checkout-route.test.ts` mockea 8 módulos. Valida la lógica del handler en aislamiento pero no captura problemas de integración (mismatches de schema Prisma, incompatibilidades de SDK de Stripe).

**Fix:** Suite pequeña de integration tests usando una DB de test (o override de `datasource` de Prisma).

---

## 🟣 P4 — DX (Developer Experience)

### 15. Idioma mixto en identificadores y comentarios

- Nombres de archivos: `productos/`, `pedidos/`, `clientes/` (español)
- Tipos/interfaces: `CartItem`, `StockManager`, `TimeGatingService` (inglés)
- Comentarios: mezcla de ambos

**Fix:** Elegir un idioma y ser consistente para artefactos de código.

---

### 16. Sin patrones UI compartidos para admin

Cada página admin re-implementa sus propios loading states, error displays y layouts de tabla. No hay `AdminPageShell`, `DataTable` o `ErrorBanner` compartidos.

**Fix:** Crear primitivos admin compartidos en `src/components/admin/`.

---

### 17. Shapes de error inconsistentes en API routes

- Algunas retornan `{ error: string }` con status 400/500
- Checkout retorna `{ error: string, details: ZodError[] }`
- Admin productos usa `mapDbError` con `{ error: string, details?: string }`
- Clientes retorna `error.message` raw (posible info leak)

**Fix:** Definir un tipo `ApiResponse<T>` compartido y un formatter de errores estándar.

---

### 18. `.env.example` incompleto

Asegurar que documente todas las variables requeridas con descripciones y cuáles son opcionales vs requeridas.

---

## Resumen

| Prioridad | # | Área | Archivo(s) | Problema |
|-----------|---|------|------------|----------|
| P0 | 1 | Seguridad | `api/pedidos/[id]/route.ts` | Datos de pedidos expuestos sin auth |
| P0 | 2 | Seguridad | `api/admin/login/route.ts`, `admin-auth.ts` | Comparaciones vulnerables a timing attacks |
| P0 | 3 | Seguridad | `security-headers.ts` | CSP demasiado permisivo |
| P1 | 4 | Calidad | 12 archivos | `formatCurrency` duplicado 12x |
| P1 | 5 | Calidad | `rate-limit*.ts`, `admin-auth*.ts` | ~200 líneas de módulos duplicados |
| P1 | 6 | Arquitectura | `admin/productos/page.tsx` | God Component de 1103 líneas |
| P1 | 7 | Type Safety | `api/productos/route.ts`, `api/admin/productos/route.ts` | Tipos `any` en producción |
| P1 | 8 | Type Safety | `types/checkout.ts` + `api/checkout/route.ts` | Schemas duplicados e inconsistentes |
| P2 | 9 | Performance | `stock-manager.ts` | N+1 queries en loop de resync |
| P2 | 10 | Performance | `api/admin/productos/route.ts` | Side-effect writes en GET handler |
| P2 | 11 | Performance | `admin-auth.ts` | DB call en cada auth check |
| P2 | 12 | Performance | `cart-sidebar.tsx` | Sin memoización |
| P2 | 13 | Testing | `tests/` | Cero tests de componentes/páginas |
| P2 | 14 | Testing | `tests/checkout-route.test.ts` | Gap de integration tests |
| P3 | 15 | DX | Proyecto completo | Idioma mixto en artefactos de código |
| P3 | 16 | DX | Páginas admin | Sin primitivas UI admin compartidas |
| P3 | 17 | DX | Todas las API routes | Shapes de error inconsistentes |
| P3 | 18 | DX | `.env.example` | Documentación de env incompleta |
