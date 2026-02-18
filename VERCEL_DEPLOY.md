# 🚀 Guía de Despliegue en Vercel

Esta guía te llevará paso a paso para desplegar **Tiempo Bakery** en Vercel.

---

## 📋 Pre-requisitos

- [ ] Cuenta en [Vercel](https://vercel.com)
- [ ] Cuenta en [Stripe](https://stripe.com) (modo test)
- [ ] Repositorio Git (GitHub, GitLab o Bitbucket)
- [ ] Node.js 20+ instalado localmente

---

## 🗄️ PASO 1: Configurar Base de Datos

### Opción A: Vercel Postgres (Recomendado) ⭐

1. Ve a tu proyecto en Vercel Dashboard
2. Click en **Storage** > **Create Database**
3. Selecciona **Postgres** (powered by Neon)
4. Click **Continue** y acepta los términos
5. La variable `DATABASE_URL` se agregará automáticamente a tu proyecto
6. Copia el valor de `DATABASE_URL` para usarlo localmente

### Opción B: Supabase (Alternativa)

1. Crea una cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a **Settings** > **Database**
4. Copia la **Connection string** (URI mode)
5. Reemplaza `[YOUR-PASSWORD]` con tu contraseña

```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### Opción C: Railway (Alternativa)

1. Crea una cuenta en [railway.app](https://railway.app)
2. Crea un nuevo proyecto > Add PostgreSQL
3. Ve a **Connect** > **Connection URL**
4. Copia la URL de conexión

---

## 🔧 PASO 2: Configurar Variables de Entorno Localmente

1. **Copia el archivo de ejemplo:**
```bash
cp .env.example .env.local
```

2. **Edita `.env.local`** y configura:

```bash
# Database (usa la URL del PASO 1)
DATABASE_URL="tu-url-de-base-de-datos"

# Stripe (obtén desde https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# URL local (cámbialo después a tu dominio de Vercel)
NEXT_PUBLIC_URL="http://localhost:3000"
```

3. **Instala dependencias:**
```bash
npm install
```

4. **Genera el cliente de Prisma:**
```bash
npm run db:generate
```

5. **Ejecuta las migraciones:**
```bash
npm run db:migrate
```

6. **Carga datos iniciales:**
```bash
npm run db:seed
```

7. **Prueba el proyecto localmente:**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para verificar.

---

## 🚢 PASO 3: Desplegar en Vercel

### A. Desde GitHub (Recomendado)

1. **Sube tu código a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/tiempo-bakery.git
git push -u origin main
```

2. **Conecta con Vercel:**
   - Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click en **Add New** > **Project**
   - Selecciona tu repositorio de GitHub
   - Click **Import**

3. **Configura el proyecto:**
   - **Framework Preset:** Next.js (se detecta automáticamente)
   - **Root Directory:** `./` (dejar por defecto)
   - **Build Command:** `npm run build` (por defecto)
   - **Output Directory:** `.next` (por defecto)

4. **Agrega las variables de entorno:**
   - En la sección **Environment Variables**, agrega:

```bash
DATABASE_URL
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_URL
```

   - ⚠️ **IMPORTANTE:** Para `NEXT_PUBLIC_URL`, usa tu dominio de Vercel: `https://tiempo-bakery.vercel.app`

5. **Click en Deploy** 🚀

### B. Desde CLI de Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel

# Agregar variables de entorno
vercel env add DATABASE_URL
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Redesplegar con las nuevas variables
vercel --prod
```

---

## 🔄 PASO 4: Ejecutar Migraciones de Prisma en Producción

Después del primer despliegue, necesitas ejecutar las migraciones:

### Opción A: Desde tu máquina local

```bash
# Usa la DATABASE_URL de producción temporalmente
DATABASE_URL="tu-url-de-produccion" npm run db:migrate

# Cargar datos iniciales
DATABASE_URL="tu-url-de-produccion" npm run db:seed
```

### Opción B: Post-install script (Automático)

Ya está configurado en `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma db push && next build"
  }
}
```

> ⚠️ `prisma db push` sincroniza el schema sin crear migraciones. Para producción, es mejor usar migraciones.

---

## 🔌 PASO 5: Configurar Webhook de Stripe

1. **Ve a Stripe Dashboard** > [Webhooks](https://dashboard.stripe.com/test/webhooks)

2. **Click en "Add endpoint"**

3. **Endpoint URL:**
```
https://tu-dominio.vercel.app/api/webhooks/stripe
```

4. **Eventos a escuchar:**
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

5. **Copia el "Signing secret"** (empieza con `whsec_...`)

6. **Agrégalo a Vercel:**
   - Ve a tu proyecto en Vercel
   - **Settings** > **Environment Variables**
   - Agrega `STRIPE_WEBHOOK_SECRET` con el valor copiado

7. **Redesplegar:**
```bash
vercel --prod
```

---

## ✅ PASO 6: Verificar Despliegue

### Checklist Post-Despliegue:

- [ ] El sitio carga correctamente en tu dominio de Vercel
- [ ] Los productos se muestran en el catálogo
- [ ] El sistema de time-gating funciona (prueba en días/horas diferentes)
- [ ] Se puede agregar productos al carrito
- [ ] El checkout redirige a Stripe
- [ ] Los webhooks de Stripe funcionan (revisa logs en Stripe Dashboard)
- [ ] Las imágenes se cargan correctamente

### Ver Logs en Vercel:

```bash
# CLI
vercel logs

# O en el dashboard
https://vercel.com/tu-usuario/tiempo-bakery/deployments
```

---

## 🔒 PASO 7: Seguridad (Para Producción)

### 1. Variables de entorno sensibles:

- ✅ Todas las variables están en Vercel (no en el código)
- ✅ `.env.local` está en `.gitignore`
- ✅ Usa las claves de **producción** de Stripe cuando estés listo

### 2. Dominio personalizado:

1. Ve a **Settings** > **Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de DNS
4. Actualiza `NEXT_PUBLIC_URL` con el nuevo dominio

### 3. HTTPS:

- ✅ Vercel provee SSL automático
- ✅ Todas las URLs usan `https://`

---

## 📊 PASO 8: Inicializar Stock Semanal

Cada semana (o la primera vez), debes inicializar el stock:

### Opción A: Desde Prisma Studio

```bash
# Local con conexión a producción
DATABASE_URL="tu-url-de-produccion" npx prisma studio
```

### Opción B: Crear un endpoint admin

Ve a `/api/admin/stock/initialize` (lo crearemos más adelante)

---

## 🐛 Problemas Comunes

### Error: "Cannot find module '@prisma/client'"

**Solución:**
```bash
npm run db:generate
vercel --prod
```

### Error de conexión a la base de datos

**Verificar:**
- La `DATABASE_URL` incluye `?sslmode=require`
- Las credenciales son correctas
- La base de datos está activa

### Webhooks de Stripe no funcionan

**Verificar:**
- El endpoint es público (no requiere autenticación)
- El `STRIPE_WEBHOOK_SECRET` es correcto
- Los eventos están configurados en Stripe Dashboard
- Revisa los logs en Stripe Dashboard > Webhooks > Endpoints

### Imágenes no cargan

**Para MVP:**
- Usa URLs externas (Cloudinary, Imgur, etc.)
- O sube imágenes a `/public/images/`

**Para producción:**
- Configura Cloudinary o Vercel Blob

---

## 🎉 ¡Listo!

Tu aplicación está desplegada en Vercel. 

**Próximos pasos:**
- Configura un dominio personalizado
- Agrega Google Analytics
- Configura Sentry para monitoreo de errores
- Implementa el panel de administración

---

## 📚 Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

**¿Problemas?** Revisa los logs: `vercel logs --follow`
