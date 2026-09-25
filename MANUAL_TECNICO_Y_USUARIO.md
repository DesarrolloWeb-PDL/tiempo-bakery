# Tiempo Masa Madre — Manual Técnico y de Usuario

---

# PARTE 1: DOCUMENTACIÓN TÉCNICA

---

## 1.1 ¿Qué es Tiempo Masa Madre?

Tiempo Masa Madre es una panadería artesanal online specializada en pan de masa madre. La plataforma permite a los clientes explorar productos, realizar pedidos con entrega local o retiro en punto, y pagar con múltiples métodos. El administrador gestiona el catálogo, stock semanal, pedidos, envíos y configuración del sitio.

---

## 1.2 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript 5 |
| Base de datos | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| UI | React 18 + Tailwind CSS + Radix UI (shadcn/ui) |
| Estado | Zustand (carrito con persistencia localStorage) |
| Validación | Zod |
| Pagos | Stripe + Mercado Pago + Transferencia bancaria |
| Email | Resend |
| Fechas | Luxon |
| Imágenes | Supabase Storage + Vercel Blob |
| Rate Limiting | Upstash Redis |
| Deploy | Vercel |
| Testing | Vitest + Testing Library |

---

## 1.3 Estructura del Proyecto

```
tiempo-bakery/
├── src/
│   ├── app/                    # Next.js App Router (páginas y API)
│   │   ├── page.tsx            # Homepage pública
│   │   ├── checkout/           # Flujo de checkout (3 pasos)
│   │   ├── productos/[slug]/   # Detalle de producto
│   │   ├── contacto/           # Página de contacto
│   │   ├── sobre-nosotros/     # Página About Us
│   │   ├── pedido/[id]/        # Confirmación de pedido
│   │   ├── admin/              # Panel de administración
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── pedidos/        # Gestión de pedidos
│   │   │   ├── productos/      # CRUD de productos
│   │   │   ├── stock/          # Stock semanal
│   │   │   ├── clientes/       # Lista de clientes
│   │   │   ├── preventa/       # Configuración de preventa
│   │   │   ├── pagos/          # Métodos de pago
│   │   │   ├── reparto/        # Gestión de reparto
│   │   │   ├── datos/          # Auditoría de datos
│   │   │   └── configuracion/  # Configuración del sitio
│   │   └── api/                # API routes (públicas y admin)
│   ├── components/             # Componentes React
│   │   ├── productos/          # Cards, galería, carrito
│   │   ├── checkout/           # Pasos del checkout
│   │   ├── admin/              # Componentes del admin
│   │   ├── ui/                 # Primitivas shadcn/ui
│   │   └── icons/              # Iconos custom
│   ├── lib/                    # Lógica de negocio (30 archivos)
│   ├── stores/                 # Zustand stores (carrito)
│   ├── hooks/                  # Custom hooks
│   ├── i18n/                   # Sistema de traducciones (ES/PT/EN)
│   └── types/                  # Definiciones TypeScript
├── prisma/
│   └── schema.prisma           # Schema de base de datos (14 modelos)
├── public/                     # Assets estáticos
├── tests/                      # Tests
└── scripts/                    # Scripts de mantenimiento
```

---

## 1.4 Modelo de Base de Datos (Prisma)

### Modelos Principales

- **Product**: id, name, slug, description, price, weight, ingredients, allergens, riskNote, imageUrl, imageAlt, stockType (WEEKLY|UNLIMITED), weeklyStock, allowSlicing, isActive, published, categoryId
- **Category**: id, name, description, order
- **ProductImage**: id, productId, url, altText, order (banco de imágenes extra)
- **Order**: id, orderNumber, customerName, customerEmail, customerPhone, deliveryMethod (PICKUP_POINT|LOCAL_DELIVERY|NATIONAL_COURIER), pickupLocation, shippingAddress, shippingCity, shippingPostalCode, status (PENDING|PAID|BAKING|READY|OUT_FOR_DELIVERY|DELIVERED|CANCELLED|DELIVERY_FAILED), paymentStatus, paymentMethod, notes, adminNotes, totalAmount, shippingCost, weekId
- **OrderItem**: id, orderId, productId, quantity, unitPrice, sliced, subtotal
- **WeeklyStock**: id, productId, weekId, maxStock, currentStock, reservedStock
- **User**: id, email, name, phone, passwordHash, role (ADMIN|CUSTOMER)
- **AdminSession**: id, jti, tokenHash, userId, expiresAt (JWT sessions)
- **SiteConfig**: key-value store para configuración del sitio (theme, contact, delivery, etc.)
- **DeliveryZone**: id, name, neighborhoods, shippingCost, minOrderForFree
- **DeliverySchedule**: id, dayOfWeek, startTime, endTime, maxOrders, cutoffDay, cutoffTime
- **DeliveryPerson**: id, name, phone, email, active
- **DeliveryAssignment**: id, orderId, deliveryPersonId, status, notes
- **PreventaConfig**: id, enabled, openingDay, openingHour, openingMinute, closingDay, closingHour, closingMinute

---

## 1.5 Autenticación y Seguridad

- **Login**: Solo contraseña (sin usuario), rate-limitado (5 intentos / 15 min)
- **Sesiones**: JWT (jti) almacenado en `AdminSession` table
- **Middleware**: Protege todas las rutas `/admin/*` y `/api/admin/*`
- **CSRF**: Protección en rutas de mutación API
- **Rate Limiting**: Upstash Redis en endpoints públicos sensibles

---

## 1.6 Flujo de Pedidos

```
Carrito → Checkout Paso 1 (Contacto) → Paso 2 (Envío) → Paso 3 (Revisión + Pago)
    ↓
Creación de Order (status: PENDING)
    ↓
Redirección a gateway de pago (Stripe/MP) o directo a confirmación (transferencia)
    ↓
Webhook actualiza paymentStatus → Order pasa a PAID
    ↓
Admin gestiona: BAKING → READY → OUT_FOR_DELIVERY (solo local) → DELIVERED
```

### Estados del Pedido

| Estado | Descripción |
|--------|-------------|
| PENDING | Creado, esperando pago |
| PAID | Pago confirmado |
| BAKING | En preparación/horneado |
| READY | Listo para retiro/entrega |
| OUT_FOR_DELIVERY | En camino (solo envío local) |
| DELIVERED | Entregado |
| CANCELLED | Cancelado |
| DELIVERY_FAILED | Fallo en entrega |

### Flujo por método de envío

- **Retiro en punto**: PENDING → PAID → BAKING → READY → DELIVERED
- **Envío local**: PENDING → PAID → BAKING → READY → OUT_FOR_DELIVERY → DELIVERED
- **Mensajería nacional**: PENDING → PAID → BAKING → READY → DELIVERED

---

## 1.7 Gestión de Stock

- **Tipos**: `WEEKLY` (limitado por semana ISO) o `UNLIMITED` (ilimitado)
- **Modelo semanal**: Cada producto tiene `WeeklyStock` por `weekId` (formato `YYYY-Www`)
- **Ciclo de vida**:
  - Admin asigna `maxStock` por producto por semana
  - Al crear pedido: stock se reserva (`reservedStock` sube)
  - Al confirmar pago: reservado se vende (`currentStock` baja, `reservedStock` baja)
  - Al cancelar: stock se libera
- **Re-sincronización**: Admin puede re-sincronizar una semana para crear filas de stock para todos los productos activos
- **Alerta de stock bajo**: Se muestra al cliente cuando quedan ≤ 3 unidades

---

## 1.8 Métodos de Pago

| Proveedor | Integración | Notas |
|-----------|-------------|-------|
| Stripe | Stripe Checkout (redirect) | Clave secreta en SiteConfig |
| Mercado Pago | MP Checkout (redirect) | Access token en SiteConfig |
| Transferencia bancaria | Manual | Muestra datos en confirmación, admin marca como pagado |

- Proveedor predefinible desde admin
- Cada proveedor se puede habilitar/deshabilitar independientemente

---

## 1.9 Time Gating (Horario de la Tienda)

- **Horario por defecto**: Abre miércoles 18:00, cierra domingo 20:00 (Europe/Madrid)
- **Configurable**: Día/hora de apertura y cierre desde admin
- **Comportamiento cuando está cerrada**: Banner de cuenta regresiva en homepage, productos sin stock se ocultan, tienda en modo "solo lectura"

---

## 1.10 Sistema de Preventa

- **Concepto**: La ventana de preventa ES el time gating. "Preventa" = período semanal de pedidos
- **Configuración**: Día/hora de apertura + cía/hora de cierre
- **Efecto**: Cuando está habilitado, la tienda muestra banner "cerrado" fuera de la ventana y oculta productos agotados

---

## 1.11 Internacionalización (i18n)

| Código | Idioma |
|--------|--------|
| `es` | Español (default) |
| `pt` | Portugués |
| `en` | Inglés |

- **Archivo**: `src/i18n/translations.ts` (~168 claves por idioma)
- **Provider**: React Context con `{ lang, t, setLang }`
- **Persistencia**: Elección de idioma en `localStorage` (`tbk_lang`)
- **UI**: Switcher en header (ES | PT | EN), cambio instantáneo sin recarga
- **Alcance**: Textos de UI del cliente (nav, footer, carrito, checkout, etc.). El admin es solo en español.
- **Contenido dinámico**: About, contacto, footer text se guardan en `SiteConfig` y se editan desde admin. No se traducen con i18n.

---

## 1.12 Despliegue

- **Plataforma**: Vercel
- **Build**: `next build`
- ** Variables de entorno**: DATABASE_URL, STRIPE_SECRET_KEY, MERCADOPAGO_ACCESS_TOKEN, RESEND_API_KEY, etc.
- **Webhooks**: `/api/webhooks/stripe`, `/api/webhooks/mercadopago`
- **Cron jobs**: `/api/cron/` para expirar pedidos no pagados

---

# PARTE 2: GUÍA DE USUARIO — PANEL DE ADMINISTRACIÓN

---

## 2.1 Acceso al Admin

1. Navegar a `/admin/login`
2. Ingresar la contraseña del administrador
3. Hacer clic en "Iniciar sesión"

El acceso es solo con contraseña (sin usuario). Hay rate limiting: 5 intentos cada 15 minutos.

---

## 2.2 Dashboard (`/admin`)

El dashboard es la pantalla principal que muestra un resumen del negocio.

### Tarjetas de métricas

- **Ventas del mes**: Ingresos totales del mes + porcentaje de crecimiento vs. mes anterior
- **Pedidos del mes**: Cantidad total + pedidos de la semana + crecimiento
- **Pendientes**: Pedidos esperando pago
- **Clientes registrados**: Total de clientes + total de pedidos

### Tabla de pedidos recientes

Muestra los últimos pedidos con:
- Número de pedido + fecha
- Nombre del cliente
- Método de envío
- Cantidad de ítems
- Total
- Estado (con badge de color)
- Estado de pago

Hacé clic en cualquier pedido para ver su detalle.

### Panel de stock semanal

Muestra barras visuales con el estado del stock por producto para la semana actual:
- Vendido (verde)
- Reservado (amarillo)
- Libre (gris)

Hacé clic en "Gestionar" para ir a la página de stock.

---

## 2.3 Gestión de Pedidos (`/admin/pedidos`)

### Lista de pedidos

**Filtros disponibles:**
- Búsqueda por número de pedido, nombre o email
- Filtro por estado: Todos, Pendiente, Pagado, En horno, Listo, En camino, Entregado, Entrega fallida, Cancelado
- Filtro por pago: Todos, Pago pendiente, Pagado, Fallido

**Columnas de la tabla:**
- Número de pedido + fecha
- Nombre + email del cliente
- Estado (badge color-coded)
- Estado de pago
- Método de envío + cantidad de ítems
- Total

**Paginación:** 20 pedidos por página con botones anterior/siguiente.

### Detalle de pedido (`/admin/pedidos/[id]`)

**Barra de progreso visual:**
Muestra el flujo de estados según el método de envío. Botones para avanzar al siguiente estado válido.

**Secciones:**
1. **Lista de productos**: Imagen, nombre, cantidad, precio unitario, estado de corte, subtotal
2. **Precios**: Subtotal, envío, total
3. **Cliente**: Nombre, email (enlace mailto), teléfono (enlace tel), notas del cliente
4. **Envío**: Método, detalles del punto de retiro O dirección de envío, repartidor asignado
5. **Pago**: Estado, método (Stripe/MP/transferencia), IDs de pago, semana. Botón "Marcar como pagado"
6. **Notas admin**: Textarea para notas internas (solo visibles para el admin)

**Acciones:**
- Avanzar estado (botón siguiente)
- Cancelar pedido
- Reintentar entrega (si falló)
- Eliminar pedido (con confirmación)

---

## 2.4 Gestión de Productos (`/admin/productos`)

### Crear producto

1. Hacé clic en "Nuevo producto"
2. Completá los campos:
   - **Nombre**: Nombre del producto (mínimo 2 caracteres)
   - **Slug**: Se genera automáticamente del nombre (ej: "pan-de-masa-madre"). Editable.
   - **Descripción**: Descripción del producto (mínimo 5 caracteres)
   - **Precio**: Precio en pesos argentinos (debe ser mayor a 0)
   - **Peso**: Peso en gramos (opcional)
   - **Ingredientes**: Lista de ingredientes (mínimo 2 caracteres)
   - **Alérgenos**: Lista separada por comas (ej: "gluten, lactosa")
   - **Nota de riesgo**: Nota adicional sobre alérgenos (opcional)
   - **Imagen principal**: Subir archivo o URL
   - **Texto alternativo**: Descripción de la imagen para accesibilidad
   - **Tipo de stock**: SEMANAL (limitado por semana) o ILIMITADO
   - **Stock semanal**: Cantidad disponible por semana (si es semanal)
   - **Permitir corte**: Si el cliente puede pedir que le corten el pan
   - **Activo**: Si aparece en la tienda
   - **Categoría**: Seleccionar categoría existente
   - **Publicado**: Si es visible para clientes
3. Hacé clic en "Guardar"

### Banco de imágenes

Cada producto puede tener múltiples imágenes:
- Subir imágenes adicionales
- Reordenar con flechas arriba/abajo
- Seleccionar imagen principal
- Eliminar imágenes

### Editar producto

1. En la lista, hacé clic en el ícono de lápiz (✏️)
2. Modificá los campos necesarios
3. Hacé clic en "Guardar"

### Eliminar producto

1. En la lista, hacé clic en el ícono de basura (🗑️)
2. Confirmá la eliminación

### Publicar/Despublicar

En la columna "Acciones", hacé clic en el badge "Publicado"/"Borrador" para alternar visibilidad.

### Gestionar categorías

1. Hacé clic en "Nueva categoría"
2. Escribí el nombre
3. Hacé clic en "Crear"
4. Para editar: hacé clic en el ícono de lápiz junto a la categoría
5. Para eliminar: hacé clic en el ícono de basura

---

## 2.5 Stock Semanal (`/admin/stock`)

### Navegación por semana

- Flechas ← → para cambiar de semana
- Botón "Hoy" para volver a la semana actual
- Se muestra el ID de semana (ej: "2025 / Sem 45")

### Tabla de stock

Agrupada por categoría. Por cada producto:
- Imagen + nombre
- Barra visual: vendido (verde) + reservado (amarillo) + libre (gris)
- Cantidad vendida
- Cantidad reservada
- Campo editable: stock máximo

### Acciones

1. **Editar stock máximo**: Modificá el número en el campo input
2. **Guardar cambios**: Hacé clic en "Guardar" para aplicar todos los cambios
3. **Re-sincronizar semana**: Botón "Re-sincronizar" que crea filas de stock para todos los productos activos basándose en su valor por defecto

**Validación:** El stock máximo no puede ser menor que vendido + reservado.

---

## 2.6 Clientes (`/admin/clientes`)

Vista de solo lectura con:
- **Búsqueda**: Por nombre, email o teléfono
- **Columnas**: Nombre, Email, Teléfono, Ciudad, Cantidad de pedidos, Fecha de registro
- **Paginación**: 20 por página

---

## 2.7 Configuración de Preventa (`/admin/preventa`)

Configura la ventana semanal de pedidos.

### Campos

- **Habilitar preventa**: Toggle on/off
- **Día de apertura**: Lunes a Domingo
- **Hora de apertura**: HH:MM
- **Día de cierre**: Lunes a Domingo
- **Hora de cierre**: HH:MM

### Valores por defecto

- Abre: Miércoles 18:00
- Cierra: Domingo 20:00

### Acciones

- **Guardar**: Aplica la configuración
- **Restaurar valores por defecto**: Vuelve a la configuración original
- **Actualizar**: Recarga la configuración actual

---

## 2.8 Métodos de Pago (`/admin/pagos`)

### Configurar Stripe

1. Activar el toggle "Habilitar Stripe"
2. Ingresar la Secret Key
3. Hacé clic en el ícono de ojo para mostrar/ocultar la clave

### Configurar Mercado Pago

1. Activar el toggle "Habilitar Mercado Pago"
2. Ingresar el Access Token
3. Hacé clic en el ícono de ojo para mostrar/ocultar el token

### Configurar Transferencia Bancaria

1. Activar el toggle "Habilitar transferencia bancaria"
2. Completar:
   - Nombre del banco
   - Titular de la cuenta
   - Alias
   - CBU
   - CUIT
   - Notas/instrucciones para el cliente

### Proveedor por defecto

Seleccioná cuál método aparece pre-seleccionado en el checkout.

---

## 2.9 Gestión de Reparto (`/admin/reparto`)

### Repartidores

**Crear repartidor:**
1. Hacé clic en "Nuevo repartidor"
2. Completar: Nombre, Teléfono, Email
3. Activar/desactivar con el toggle
4. Hacé clic en "Guardar"

**Editar/Eliminar:** Íconos de lápiz y basura junto a cada repartidor.

### Asignaciones

Vista para asignar repartidores a pedidos de envío local:
- Pedidos pendientes de asignación
- Repartidor asignado
- Estado de la asignación

### Reportes

Sección de reportes de entrega (estadísticas de reparto).

---

## 2.10 Auditoría de Datos (`/admin/datos`)

Vista de diagnóstico de integridad de datos.

### Tarjetas de resumen

- Cantidad de productos, categorías, pedidos, usuarios, filas de stock, imágenes extra

### Información del tema

- Título actual, subtítulo, logo con preview

### Diagnósticos

- ¿El logo apunta a localhost? (sí/no)
- Productos con URLs de imagen de localhost
- Productos sin imagen
- Productos con imágenes fuera del banco

### Lista de productos

Scroll con preview de imagen, slug, categoría, estado publicado/activo.

---

## 2.11 Configuración del Sitio (`/admin/configuracion`)

Pestañas de configuración centralizada:

### Pestaña "Entrega"

- **Preventa**: Configuración de ventana de pedidos
- **Costos de envío**: Retiro (gratis), Envío local, Mensajería nacional (con toggle para habilitar/deshabilitar)
- **Puntos de retiro**: CRUD (nombre, dirección, ciudad, código postal, horario, instrucciones)
- **Zonas de envío**: CRUD (nombre, barrios, costo de envío, mínimo para envío gratis)
- **Horarios de envío**: CRUD (día de semana, horario, máximo de pedidos, día/hora de corte)

### Pestaña "Header"

- Título de la tienda
- Subtítulo/tagline
- Logo (subir archivo o URL)
- Tamaño del logo (24-64px)
- Ancho máximo del header
- Tipografía (fuente de títulos de Google Fonts o sistema, fuente de cuerpo)
- Título del hero
- Subtítulo del hero
- Imagen de fondo del hero

### Pestaña "Footer"

- Descripción del footer
- Título del horario
- Texto del horario
- Título de contacto
- Texto de envío
- Nota legal

### Pestaña "Nav"

- Etiquetas de links de navegación (Productos, Nosotros, Contacto)

### Pestaña "Nosotros"

- Título de la página
- Texto principal
- Texto secundario

### Pestaña "Contacto"

- Título de la página
- Texto introductorio
- Email de contacto
- Teléfono
- Número de WhatsApp
- URL de Instagram
- Dirección
- Nombre de la ciudad
- Texto de retiro
- Texto de envío local
- Texto de mensajería

### Pestaña "Pagos"

- Enlace a configuración de métodos de pago

### Personalización del tema

Configuración completa de colores CSS:
- Color primario, secundario, acento
- Color de fondo del body, cards
- Colores de texto (primario, secundario, muted)
- Color de borde
- Colores de estado (éxito, warning, error)
- Paleta de dorados
- Tamaños de logo
- Alineación del título

---

# PARTE 3: GUÍA DE USUARIO — APLICACIÓN (TIENDA PARA EL CLIENTE)

---

## 3.1 Homepage (`/`)

### Lo que ve el cliente

1. **Hero Section**: Imagen de fondo configurable con título ("Pan Artesanal de Masa Madre") y subtítulo
2. **Banner de horario**: 
   - Si está abierto: badge verde "Abierto" con horario
   - Si está cerrado: badge rojo "Cerrado" con cuenta regresiva hasta la próxima apertura
3. **Catálogo de productos**: Organizado por categoría en grilla de 2 columnas. Cada categoría es un panel desplegable.
4. **Sección de información**: 3 columnas con info de preventa, masa madre y retiro

### Qué puede hacer el cliente

- Explorar productos por categoría
- Agregar productos al carrito
- Ver estado abierto/cerrado
- Navegar a detalle de producto
- Cambiar idioma (ES/PT/EN)
- Abrir chat de WhatsApp

### Productos visibles

Solo se muestran productos activos + publicados. Cuando la tienda está cerrada, se ocultan productos con stock cero.

---

## 3.2 Detalle de Producto (`/productos/[slug]`)

### Lo que ve el cliente

- **Galería de imágenes**: Múltiples fotos con navegación (flechas izquierda/derecha, dots indicadores)
- **Nombre del producto**
- **Categoría**
- **Descripción**
- **Precio**
- **Peso** (si existe)
- **Ingredientes**
- **Alérgenos** (con badges)
- **Nota de riesgo** (si existe)
- **Stock disponible**: "X disponibles" o "¡Últimas unidades!" (≤3) o "Agotado"

### Qué puede hacer el cliente

- Navegar la galería de imágenes
- Ver toda la información del producto
- Elegir cantidad
- Decidir si quiere el pan cortado (si allowSlicing está activado)
- Agregar al carrito
- Volver al catálogo

---

## 3.3 Carrito (Sidebar)

### Lo que ve el cliente

Panel deslizante desde la derecha con:
- Lista de productos en el carrito
- Por cada producto: imagen, nombre, peso, checkbox de corte, controles de cantidad (+/-), precio, botón de eliminar
- Subtotal
- Botón "Finalizar compra"
- Botón "Seguir comprando"

### Qué puede hacer el cliente

- Ajustar cantidades (respeta el stock máximo)
- Activar/desactivar corte por producto
- Eliminar productos
- Ver subtotal
- Ir al checkout
- Seguir comprando

### Persistencia

El carrito se guarda en localStorage. Si cerrás el navegador y volvés, el carrito sigue ahí.

---

## 3.4 Checkout (`/checkout`) — Flujo de 3 Pasos

### Paso 1: Contacto

**Campos:**
- Email (validación de formato)
- Nombre completo (mínimo 2 caracteres)
- Teléfono (mínimo 9 dígitos)

Hacé clic en "Continuar".

### Paso 2: Envío

**Elegí un método de envío:**

#### Retiro en punto
- Seleccioná un punto de la lista (nombre, dirección, horario)
- **Costo**: Gratis

#### Envío local
1. Seleccioná tu zona de envío
2. Elegí el día y horario disponible
3. Ingresá tu dirección
- **Costo**: Según la zona

#### Mensajería nacional
- Ingresá dirección, ciudad y código postal
- **Costo**: Fijo (configurable desde admin, se puede deshabilitar)

Hacé clic en "Continuar".

### Paso 3: Revisión y Pago

**Lo que ves:**
- Resumen del pedido (productos, cantidades, estado de corte)
- Información de contacto
- Detalles del método de envío
- Selector de método de pago (Stripe / Mercado Pago / Transferencia bancaria)
- Campo de notas para el cliente (máximo 500 caracteres)
- Desglose: Subtotal + Envío = Total
- Estado del pago

**Hacé clic en "Confirmar pedido".**

### Manejo del pago

- **Stripe**: Se abre Checkout de Stripe en nueva pestaña. Se muestra overlay de procesamiento.
- **Mercado Pago**: Se abre Checkout de MP en nueva pestaña. Se muestra overlay.
- **Transferencia bancaria**: Se redirige directo a la página de confirmación con datos bancarios.

---

## 3.5 Confirmación de Pedido (`/pedido/[id]/confirmacion`)

### Lo que ve el cliente

1. **Encabezado de éxito**: Número de pedido, o "Pago pendiente" si falló el pago con MP
2. **Comprobante imprimible**: Estilo recibo con código QR, número de pedido, productos, total, info de envío
3. **Botón de imprimir**
4. **Botón de enviar por WhatsApp**: Mensaje pre-formateado con detalles del pedido
5. **Lista de productos**: Imágenes, cantidades, estado de corte, precios
6. **Detalles de envío**: Punto de retiro O dirección de envío
7. **Resumen**: Subtotal, envío, total, estado de pago, estado del pedido
8. **Datos bancarios** (si aplica): Nombre del banco, titular, alias, CBU, CUIT, notas
9. **Aviso de email**: "Recibirás un email de confirmación"
10. **Info de contacto**: Datos para consultas

### Qué puede hacer el cliente

- Imprimir el comprobante
- Enviar detalles por WhatsApp
- Volver a la tienda

---

## 3.6 Páginas Estáticas

### Sobre Nosotros (`/sobre-nosotros`)

Título + dos párrafos de contenido institucional (configurable desde admin).

### Contacto (`/contacto`)

- Título e intro
- Email, teléfono, WhatsApp, Instagram
- Dirección
- **Botón de WhatsApp**: Abre chat directo
- **Tarjeta de métodos de envío**: Explicación de retiro, envío local y mensajería nacional

---

## 3.7 WhatsApp

### Bot de WhatsApp

Botón flotante que abre un panel de chat con 6 preguntas frecuentes pre-configuradas:
1. ¿Qué es la masa madre?
2. ¿Cuándo entregan?
3. ¿Hacen envío a domicilio?
4. ¿Tienen opciones sin gluten?
5. ¿Cómo hago un pedido?
6. ¿Dónde puedo retirar?

Cada pregunta envía una respuesta pre-escrita a WhatsApp. También hay botón "Escribir mensaje libre".

### Botón de WhatsApp simple

Aparece cuando el bot no está activo. Abre WhatsApp con mensaje de saludo por defecto.

---

## 3.8 Multi-idioma

El cliente puede cambiar entre español, portugués e inglés con los botones del header. El cambio es instantáneo y persiste entre sesiones.

---

## 3.9 Flujo Completo del Cliente

```
1. Entrar a la tienda → Ver hero + banner de horario
2. Explorar productos → Categorías desplegables con cards de producto
3. Ver detalle → Galería, ingredientes, alérgenos, precio
4. Agregar al carrito → Sidebar con cantidades y corte
5. Checkout → Contacto → Envío → Revisión + Pago
6. Pago → Stripe/MP (nueva pestaña) o Transferencia (directo)
7. Confirmación → Comprobante imprimible + WhatsApp
8. Recibir email de confirmación
9. Esperar entrega/retiro
```

---

*Documento generado para uso en NotebookLM — Tiempo Masa Madre, 2026*
