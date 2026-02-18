# Fase 2: Checkout y Pagos - Implementación Completa

## ✅ Estado: Completado

La Fase 2 implementa el flujo completo de checkout, procesamiento de pagos con Stripe y confirmación de pedidos.

---

## 🎯 Funcionalidades Implementadas

### 1. **Formulario de Checkout Multi-Paso**

📍 **Ruta:** `/checkout`
📁 **Archivo:** `src/app/checkout/page.tsx`

**Características:**
- Wizard de 3 pasos con barra de progreso
- Validación en tiempo real con Zod
- Persistencia del estado del formulario
- Responsive y accesible

**Pasos del formulario:**

#### **Paso 1: Información del Cliente**
- Nombre completo (mínimo 2 caracteres)
- Email (validación de formato)
- Teléfono (mínimo 9 caracteres)

#### **Paso 2: Método de Entrega**
Tres opciones disponibles:
- **Recogida en punto** (gratis)
  - Selección de punto de recogida desde lista dinámica
  - Muestra dirección y horarios de recogida
- **Envío local** (5€)
  - Dentro de Barcelona y área metropolitana
  - Sin seguimiento incluido
- **Mensajería nacional** (10€)
  - Resto de España
  - Seguimiento completo

**Campos de envío (condicionales):**
- Dirección completa
- Ciudad
- Código postal

#### **Paso 3: Revisión del Pedido**
- Resumen de productos del carrito
- Detalles del cliente
- Información de entrega
- Desglose de precios (subtotal + envío)
- Campo opcional para notas adicionales
- Botón de pago que redirige a Stripe

---

### 2. **API de Checkout**

📍 **Endpoint:** `POST /api/checkout`
📁 **Archivo:** `src/app/api/checkout/route.ts`

**Flujo de procesamiento:**

```
1. Verificar time-gating (horario de pedidos)
2. Validar datos con Zod
3. Verificar disponibilidad de stock para todos los productos
4. Obtener información de productos desde DB
5. Calcular precios y validar contra precios del front-end
6. Calcular costos de envío según método
7. Buscar o crear usuario
8. Generar número de pedido único (TBK-YYYY-NNNN)
9. Crear pedido en estado PENDING
10. Reservar stock para la semana actual
11. Crear sesión de pago en Stripe con line items
12. Actualizar pedido con ID de Stripe
13. Retornar URL de checkout de Stripe
```

**Validaciones implementadas:**
- ✅ Horario de pedidos (time-gating)
- ✅ Stock disponible para cada producto
- ✅ Precios correctos desde la base de datos
- ✅ Formato de datos (email, teléfono, direcciones)
- ✅ Cantidades mínimas (≥ 1)

**Gestión de errores:**
- 403: Sitio cerrado para pedidos
- 400: Datos inválidos (con detalles de Zod)
- 400: Stock insuficiente (indica producto)
- 500: Error del servidor

**Respuesta exitosa:**
```json
{
  "success": true,
  "orderId": "uuid",
  "orderNumber": "TBK-2024-0001",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

---

### 3. **Integración con Stripe**

**Configuración:**
- API Version: `2024-12-18.acacia`
- Modo: `payment` (pago único)
- Métodos aceptados: `card`

**Line Items:**
- Productos individuales con nombre, descripción (rebanado/sin rebanar), precio unitario y cantidad
- Gastos de envío como línea separada (si > 0€)

**URLs de retorno:**
- **Success:** `/pedido/[id]/confirmacion?session_id={CHECKOUT_SESSION_ID}`
- **Cancel:** `/checkout?cancelled=true`

**Metadata incluida:**
- `orderId`: ID del pedido en nuestra DB
- `orderNumber`: Número de pedido legible (TBK-YYYY-NNNN)

---

### 4. **Webhook de Stripe**

📍 **Endpoint:** `POST /api/webhooks/stripe`
📁 **Archivo:** `src/app/api/webhooks/stripe/route.ts`

**Eventos escuchados:**

#### `checkout.session.completed`
- Actualiza estado del pedido a `PAID`
- Registra fecha de pago (`paidAt`)
- Confirma venta de stock (llama a `stockManager.confirmSale`)

#### `payment_intent.succeeded`
- Log de éxito adicional

#### `payment_intent.payment_failed`
- Actualiza estado del pedido a `CANCELLED`
- Libera stock reservado (llama a `stockManager.releaseStock`)

**Seguridad:**
- Verificación de firma del webhook con `STRIPE_WEBHOOK_SECRET`
- Respuestas 400 en caso de firma inválida
- Manejo de errores con logs detallados

**Configuración requerida en Stripe:**
```bash
# Obtener secret del webhook en local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# En producción, configurar en Dashboard de Stripe:
# URL: https://tu-dominio.com/api/webhooks/stripe
# Eventos: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed
```

---

### 5. **API de Pedidos**

📍 **Endpoint:** `GET /api/pedidos/[id]`
📁 **Archivo:** `src/app/api/pedidos/[id]/route.ts`

**Funcionalidad:**
- Obtiene detalles completos de un pedido por ID
- Incluye items del pedido con información del producto
- Incluye información del usuario
- Formatea precios de Decimal a Number

**Respuesta:**
```json
{
  "id": "uuid",
  "orderNumber": "TBK-2024-0001",
  "status": "PAID",
  "paymentStatus": "PAID",
  "createdAt": "2024-01-01T10:00:00Z",
  "paidAt": "2024-01-01T10:05:00Z",
  "customerName": "Juan Pérez",
  "customerEmail": "juan@example.com",
  "customerPhone": "666777888",
  "deliveryMethod": "PICKUP_POINT",
  "pickupLocation": "Panadería Central",
  "pickupAddress": "Calle Mayor 1, Barcelona",
  "pickupSchedule": "Lunes a Sábado: 8:00-20:00",
  "subtotal": 24.50,
  "shippingCost": 0,
  "total": 24.50,
  "items": [
    {
      "id": "uuid",
      "productName": "Pan de Pueblo",
      "quantity": 2,
      "unitPrice": 5.50,
      "subtotal": 11.00,
      "sliced": true,
      "product": {
        "name": "Pan de Pueblo",
        "imageUrl": "/images/pan-pueblo.jpg",
        "weight": 800
      }
    }
  ]
}
```

---

### 6. **Página de Confirmación**

📍 **Ruta:** `/pedido/[id]/confirmacion`
📁 **Archivo:** `src/app/pedido/[id]/confirmacion/page.tsx`

**Características:**
- Client Component con carga asíncrona de datos
- Estados de loading, error y éxito
- Diseño responsive con grid adaptativo

**Secciones:**

#### **Header de Éxito**
- Ícono de check verde
- Mensaje de confirmación personalizado
- Número de pedido visible

#### **Notificación de Email**
- Banner azul informando sobre email enviado

#### **Productos**
- Lista de productos con imagen
- Cantidad, precio unitario y subtotal
- Badges para cantidades y opciones (rebanado)

#### **Método de Entrega**
- Ícono según tipo de entrega
- Detalles específicos:
  - **Recogida:** punto, dirección y horarios
  - **Envío:** dirección completa de destino

#### **Notas del Pedido** (opcional)
- Muestra notas del cliente si existen

#### **Resumen (Sidebar)**
- Desglose de precios (subtotal + envío + total)
- Estado de pago con badge
- Estado del pedido
- Botón para volver a la tienda
- Información de contacto

**Estados de carga:**
- **Loading:** Spinner con mensaje
- **Error:** Card con mensaje de error y botón "Volver a la tienda"
- **Éxito:** Vista completa del pedido

---

## 🗂️ Tipos y Schemas

📁 **Archivo:** `src/types/checkout.ts`

### Enums
```typescript
export enum DeliveryMethod {
  PICKUP_POINT = 'PICKUP_POINT',
  LOCAL_DELIVERY = 'LOCAL_DELIVERY',
  NATIONAL_COURIER = 'NATIONAL_COURIER',
}
```

### Interfaces
```typescript
export interface CheckoutFormData {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  pickupLocationId?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostal?: string;
  customerNotes?: string;
}

export interface CheckoutItemData {
  productId: string;
  quantity: number;
  sliced: boolean;
}
```

### Constantes
```typescript
export const SHIPPING_COSTS = {
  PICKUP_POINT: 0,
  LOCAL_DELIVERY: 5,
  NATIONAL_COURIER: 10,
} as const;
```

### Schemas de Validación (Zod)
```typescript
export const checkoutSchema = z.object({
  customerEmail: z.string().email('Email inválido'),
  customerName: z.string().min(2, 'Nombre demasiado corto'),
  customerPhone: z.string().min(9, 'Teléfono debe tener al menos 9 dígitos'),
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  pickupLocationId: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingPostal: z.string().optional(),
  customerNotes: z.string().max(500).optional(),
});
```

---

## 🧩 Componentes Creados

### 1. **CustomerInfoStep**
📁 `src/components/checkout/customer-info-step.tsx`

- Inputs para nombre, email y teléfono
- Validación en tiempo real
- Mensajes de error específicos
- Auto-enfoque en primer campo

### 2. **DeliveryStep**
📁 `src/components/checkout/delivery-step.tsx`

- Radio buttons para seleccionar método
- Cards con íconos y precios
- Dropdown de puntos de recogida (carga desde API)
- Inputs condicionales para dirección de envío
- Validación dinámica según método seleccionado

### 3. **ReviewStep**
📁 `src/components/checkout/review-step.tsx`

- Resumen de productos del carrito
- Información del cliente
- Detalles de entrega
- Desglose de precios
- Textarea para notas opcionales
- Botón de pago con estado de loading
- Manejo de errores con mensajes

---

## 🔐 Variables de Entorno Requeridas

Ya configuradas en `.env.local`:

```bash
# Stripe (usar claves de test primero)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL de la aplicación
NEXT_PUBLIC_URL=http://localhost:3000  # Cambiar en producción
```

---

## 🧪 Testing del Flujo Completo

### **1. Preparar el entorno**

```bash
# Terminal 1: Iniciar app
npm run dev

# Terminal 2: Escuchar webhooks de Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### **2. Prueba de checkout**

1. **Agregar productos al carrito**
   - Ve a la homepage
   - Agrega 2-3 productos diferentes
   - Verifica que el carrito muestre correctamente

2. **Abrir checkout**
   - Haz clic en el botón del carrito
   - Navega a `/checkout`

3. **Paso 1: Información del cliente**
   - Nombre: "Test User"
   - Email: "test@test.com"
   - Teléfono: "666777888"
   - Clic en "Continuar"

4. **Paso 2: Método de entrega**
   
   **Opción A - Recogida:**
   - Selecciona "Recogida en punto de recogida"
   - Elige un punto del dropdown
   - Clic en "Continuar"
   
   **Opción B - Envío local:**
   - Selecciona "Envío local"
   - Dirección: "Calle Test 123"
   - Ciudad: "Barcelona"
   - Código postal: "08001"
   - Clic en "Continuar"

5. **Paso 3: Revisión**
   - Verifica que todos los datos sean correctos
   - (Opcional) Agrega notas: "Por favor llamar al llegar"
   - Clic en "Proceder al pago"

6. **Stripe Checkout**
   - Usa tarjeta de test: `4242 4242 4242 4242`
   - Fecha: cualquier fecha futura
   - CVC: cualquier 3 dígitos
   - Completa el pago

7. **Página de confirmación**
   - Deberías ver la página de confirmación
   - Verifica que se muestren:
     - ✅ Mensaje de éxito
     - ✅ Número de pedido
     - ✅ Lista de productos
     - ✅ Método de entrega
     - ✅ Resumen de precios
     - ✅ Estado: PAID

8. **Verificar webhook**
   - En el terminal de Stripe, deberías ver:
     - `checkout.session.completed` procesado
     - Orden actualizada a PAID

9. **Verificar base de datos**
```sql
-- Ver el pedido creado
SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 1;

-- Ver items del pedido
SELECT * FROM "OrderItem" WHERE "orderId" = 'ID_DEL_PEDIDO';

-- Ver stock actualizado
SELECT * FROM "WeeklyStock" ORDER BY "lastUpdated" DESC;
```

### **3. Tarjetas de test adicionales**

Para probar diferentes escenarios:

| Tarjeta | Resultado |
|---------|-----------|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0000 0000 9995` | ❌ Fondos insuficientes |
| `4000 0000 0000 0002` | ❌ Tarjeta declinada |
| `4000 0025 0000 3155` | 🔐 Requiere autenticación 3D Secure |

---

## 📊 Estados del Pedido

### Order Status
- **PENDING**: Pedido creado, esperando pago
- **PAID**: Pago confirmado
- **PROCESSING**: En preparación
- **READY**: Listo para entrega/envío
- **DELIVERED**: Entregado al cliente
- **CANCELLED**: Cancelado (por fallo de pago o solicitud)

### Payment Status
- **PENDING**: Esperando pago
- **PAID**: Pagado correctamente
- **FAILED**: Pago fallido
- **REFUNDED**: Reembolsado

---

## 🚨 Manejo de Errores

### En el Frontend (Checkout Page)
- Validación en tiempo real con mensajes específicos
- Prevención de envío con datos incompletos
- Spinner durante procesamiento
- Alertas de error con mensajes claros
- Preservación del estado del formulario

### En el API
- Validación con Zod (errores 400 con detalles)
- Verificación de stock (error específico por producto)
- Time-gating (error 403 cuando está cerrado)
- Manejo de errores de Stripe
- Logs detallados en consola

### En Webhook
- Verificación de firma obligatoria
- Manejo de eventos desconocidos
- Rollback manual en caso de error (liberar stock)
- Logs de cada evento procesado

---

## 🎨 Mejoras UX Implementadas

1. **Progress stepper visual** en checkout
2. **Validación en tiempo real** con mensajes claros
3. **Carga dinámica** de puntos de recogida
4. **Campos condicionales** según método de entrega
5. **Preservación del estado** al navegar entre pasos
6. **Disabled states** para prevenir errores
7. **Loading indicators** durante operaciones async
8. **Confirmación visual** con check verde grande
9. **Responsive design** mobile-first
10. **Información contextual** (badges, íconos, colores)

---

## ✅ Checklist de Implementación

- [x] Tipos y schemas de checkout
- [x] Componente CustomerInfoStep
- [x] Componente DeliveryStep
- [x] Componente ReviewStep
- [x] Página de checkout multi-paso
- [x] API de checkout con validaciones
- [x] Integración con Stripe Checkout
- [x] Webhook de Stripe
- [x] API para obtener pedido por ID
- [x] Página de confirmación del pedido
- [x] Manejo de errores completo
- [x] Responsive design
- [x] Testing manual exitoso

---

## 🔜 Próximos Pasos (Fase 3)

1. **Emails de confirmación**
   - Integración con Resend o SendGrid
   - Template de confirmación de pedido
   - Notificaciones de cambio de estado

2. **Panel de administración**
   - Dashboard de pedidos
   - Gestión de estados
   - Exportación de datos

3. **Testing automatizado**
   - Tests unitarios de componentes
   - Tests de integración de APIs
   - Tests E2E con Playwright

4. **Deploy a producción**
   - Configuración en Vercel
   - Variables de entorno productivas
   - Monitoreo y logs

---

## 📝 Notas Importantes

- ⚠️ **Stock management**: El stock se reserva al crear el pedido y se confirma al recibir el webhook. Si el webhook falla, el stock queda reservado (esto previene overselling).
  
- ⚠️ **Webhook local**: Para desarrollo local, DEBES ejecutar `stripe listen` para recibir webhooks. Sin esto, los pedidos se quedarán en PENDING.

- ⚠️ **Time-gating**: Recuerda que solo puedes hacer pedidos de miércoles 18:00 a domingo 20:00. Para desarrollo, puedes ajustar esto en `src/lib/time-gating.ts`.

- ⚠️ **URLs**: Asegúrate de que `NEXT_PUBLIC_URL` esté configurado correctamente tanto en local como en producción para que las redirects funcionen.

---

## 🎉 Resultado

**Fase 2 completada con éxito**. El flujo completo de checkout y pagos está funcional, seguro y probado. Los clientes ahora pueden:

1. ✅ Completar checkout con información validada
2. ✅ Seleccionar método de entrega con precios dinámicos
3. ✅ Pagar de forma segura con Stripe
4. ✅ Ver confirmación detallada del pedido
5. ✅ Sistema robusto de gestión de stock

El sistema está listo para **testing exhaustivo** y posterior **deploy a producción**.
