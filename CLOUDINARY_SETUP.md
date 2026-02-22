# Configuración de Cloudinary para imágenes en producción

Para que la subida y visualización de imágenes funcione correctamente en Vercel, sigue estos pasos para integrar Cloudinary:

---

## 1. Crea una cuenta en Cloudinary
- Ve a https://cloudinary.com/ y regístrate (plan gratuito suficiente para empezar).

## 2. Obtén tus credenciales
- En el dashboard de Cloudinary, busca:
  - **Cloud name**
  - **API Key**
  - **API Secret**

## 3. Agrega las variables de entorno en Vercel
- Ve a tu proyecto en Vercel > Settings > Environment Variables
- Agrega:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` → tu cloud name
  - `CLOUDINARY_API_KEY` → tu API Key
  - `CLOUDINARY_API_SECRET` → tu API Secret

> **Importante:** No pongas estas variables en el código ni en GitHub, solo en Vercel.

## 4. Despliega de nuevo tu proyecto
- Haz un nuevo deploy en Vercel para que las variables tomen efecto.

## 5. Prueba la subida de imágenes desde el admin
- Sube una imagen de producto o logo desde el panel de administración.
- Verifica que la URL generada apunte a Cloudinary (ejemplo: `https://res.cloudinary.com/...`).

---

### ¿Por qué Cloudinary?
- Permite almacenar y servir imágenes de forma profesional, rápida y segura.
- Compatible con Next.js y Vercel (filesystem serverless).
- Optimización automática de imágenes y CDN global.

---

¿Dudas? Consulta la documentación oficial:
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Vercel Docs](https://vercel.com/docs)

---

_Archivo generado automáticamente para facilitar la integración de imágenes en producción._
