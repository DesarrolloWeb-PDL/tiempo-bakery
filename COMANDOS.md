# ⚡ Comandos Rápidos - Tiempo Bakery

Referencia rápida de todos los comandos que necesitas.

---

## 🚀 Inicio del Proyecto

```bash
# Instalar todas las dependencias
npm install

# Generar cliente de Prisma
npm run db:generate

# Ejecutar migraciones (crear tablas en BD)
npm run db:migrate

# Cargar datos de ejemplo
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

---

## 🗄️ Base de Datos (Prisma)

```bash
# Ver/editar datos en interfaz gráfica
npm run db:studio

# Generar cliente de Prisma después de cambios en schema
npm run db:generate

# Crear nueva migración
npm run db:migrate

# Sincronizar schema sin migraciones (desarrollo)
npm run db:push

# Recargar datos de ejemplo
npm run db:seed
```

---

## 🛠️ Desarrollo

```bash
# Iniciar servidor en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en modo producción
npm start

# Linter (revisar código)
npm run lint
```

---

## 🔍 Testing y Debugging

### Ver logs de la aplicación
Los logs aparecen en la terminal donde ejecutaste `npm run dev`

### Prisma Studio
```bash
npm run db:studio
# Abre en http://localhost:5555
```

### Ver datos en consola del navegador
```javascript
// En la consola del navegador (F12)

// Ver carrito actual
JSON.parse(localStorage.getItem('tiempo-bakery-cart'))

// Limpiar carrito
localStorage.clear()
```

### Probar APIs con curl

```bash
# Listar productos
curl http://localhost:3000/api/productos

# Solo disponibles
curl http://localhost:3000/api/productos?disponibles=true

# Por categoría
curl http://localhost:3000/api/productos?categoria=panes

# Detalle de producto
curl http://localhost:3000/api/productos/pan-espelta-integral

# Time-gating status
curl http://localhost:3000/api/time-gating

# Puntos de recogida
curl http://localhost:3000/api/puntos-recogida
```

---

## 🚢 Despliegue en Vercel

### Primera vez (desde CLI)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel

# Desplegar a producción
vercel --prod
```

### Desde GitHub
1. Push a GitHub
2. Conectar en vercel.com
3. Deploy automático en cada push

### Agregar variables de entorno
```bash
vercel env add DATABASE_URL
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

---

## 🔧 Utilidades de PostgreSQL

### Conectar a PostgreSQL local
```bash
psql -U postgres
```

### Comandos útiles en psql
```sql
-- Listar bases de datos
\l

-- Conectar a una base de datos
\c tiempo_bakery

-- Listar tablas
\dt

-- Ver datos de una tabla
SELECT * FROM "Product";

-- Salir
\q
```

---

## 📦 Git (Control de Versiones)

```bash
# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit with Phase 1 MVP"

# Conectar con GitHub
git remote add origin https://github.com/tu-usuario/tiempo-bakery.git

# Subir a GitHub
git push -u origin main

# Ver estado
git status

# Ver cambios
git diff
```

---

## 🧹 Limpieza y Reset

### Limpiar caché de Next.js
```bash
rm -rf .next
npm run dev
```

### Regenerar node_modules
```bash
rm -rf node_modules
npm install
```

### Reset completo de la base de datos
```bash
# CUIDADO: Esto borra todos los datos

# Opción 1: Recrear desde cero
# Eliminar la base de datos y crearla de nuevo en psql
# Luego:
npm run db:migrate
npm run db:seed

# Opción 2: Con Prisma (más seguro)
npx prisma migrate reset
# Esto borra datos, aplica migraciones y ejecuta seed automáticamente
```

---

## 🔍 Búsqueda y Análisis

### Buscar en el código
```bash
# Buscar texto en todos los archivos
grep -r "texto a buscar" src/

# Buscar archivos por nombre
find src/ -name "*.tsx"

# Contar líneas de código
find src/ -name "*.tsx" -o -name "*.ts" | xargs wc -l
```

### Ver estructura de carpetas
```bash
# Windows PowerShell
tree /F

# O instalar tree para Windows
# choco install tree
```

---

## 📊 Análisis y Monitoreo

### Ver tamaño del build
```bash
npm run build

# El output mostrará el tamaño de cada página
```

### Analizar bundles (opcional)
```bash
# Instalar analizador
npm install -D @next/bundle-analyzer

# Agregar a next.config.js y ejecutar
ANALYZE=true npm run build
```

---

## 🔄 Actualizaciones

### Actualizar dependencias
```bash
# Ver dependencias desactualizadas
npm outdated

# Actualizar todas a versiones menores
npm update

# Actualizar Prisma específicamente
npm install @prisma/client@latest prisma@latest
npm run db:generate
```

---

## 🐛 Solución Rápida de Problemas

### Error: Cannot find module '@prisma/client'
```bash
npm run db:generate
```

### Error: relation does not exist
```bash
npm run db:migrate
```

### Error: Environment variable not found
```bash
# Verifica que .env.local exista y tenga DATABASE_URL
cat .env.local
```

### Puerto 3000 ya en uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# O usar otro puerto
PORT=3001 npm run dev
```

### Limpiar todo y empezar de nuevo
```bash
rm -rf node_modules .next
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

---

## 📝 Scripts Personalizados

Puedes agregar estos scripts útiles a `package.json`:

```json
{
  "scripts": {
    "reset": "npx prisma migrate reset",
    "fresh": "rm -rf .next && npm run dev",
    "setup": "npm install && npm run db:generate && npm run db:migrate && npm run db:seed",
    "check": "npm run lint && tsc --noEmit"
  }
}
```

Luego usarlos:
```bash
npm run reset   # Reset completo de BD
npm run fresh   # Limpiar caché y reiniciar
npm run setup   # Setup completo del proyecto
npm run check   # Verificar código
```

---

## 🎯 Flujo de Trabajo Recomendado

### Desarrollo diario
```bash
# Mañana
npm run dev                    # Iniciar servidor
npm run db:studio             # Abrir Prisma Studio (otra terminal)

# Durante el día
# Haz cambios en el código
# El servidor se recarga automáticamente

# Si cambias el schema de Prisma
npm run db:generate           # Regenerar cliente
npm run db:migrate           # Crear migración

# Antes de terminar
git add .
git commit -m "Descripción de cambios"
git push
```

### Antes de desplegar
```bash
npm run lint                  # Verificar errores
npm run build                 # Probar build de producción
npm start                     # Probar en modo producción localmente
```

---

## 📚 Documentación de Referencia

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Zustand**: https://docs.pmnd.rs/zustand
- **Tailwind**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 💡 Tips Pro

1. **Dos terminales**: Una para `npm run dev`, otra para comandos
2. **Prisma Studio abierto**: Muy útil para ver datos en tiempo real
3. **Extensiones VS Code**: Prisma, Tailwind CSS IntelliSense, ES7+ React
4. **Git commits frecuentes**: Pequeños commits son mejores
5. **Lee los errores**: Los logs son muy descriptivos

---

¿Necesitas ayuda? Revisa [INICIO_RAPIDO.md](INICIO_RAPIDO.md) 🚀
