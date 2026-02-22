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

## ¿Por qué Cloudinary es la mejor opción para este proyecto?

- **Compatible con Vercel y Next.js:** Permite subir imágenes desde el admin y servirlas de forma rápida y segura, sin preocuparte por el filesystem del servidor.
- **Optimización automática:** Cloudinary optimiza, redimensiona y sirve las imágenes desde un CDN global, mejorando la velocidad de carga.
- **Escalabilidad y seguridad:** No tienes que preocuparte por backups, espacio en disco ni migraciones.
- **Simplicidad:** Solo guardas la URL de la imagen en la base de datos, el resto lo gestiona Cloudinary.
- **Plan gratuito generoso:** Suficiente para la mayoría de proyectos pequeños y medianos.

---

## ¿Cómo funciona el flujo?

1. El admin sube una imagen desde el panel.
2. El backend la sube a Cloudinary usando las variables de entorno.
3. Cloudinary devuelve una URL pública optimizada.
4. El backend guarda esa URL en el campo `imageUrl` del producto.
5. El frontend muestra la imagen usando esa URL.

---

## Ventajas frente a otras opciones

- No dependes del disco del servidor (que en Vercel es efímero).
- No saturas la base de datos con archivos binarios.
- Puedes migrar o cambiar de proveedor en el futuro fácilmente.
- Tus imágenes siempre estarán disponibles y optimizadas para web.

---

_¡Listo! Con Cloudinary tienes una solución profesional, robusta y escalable para la gestión de imágenes en tu e-commerce._

---

¿Dudas? Consulta la documentación oficial:
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Vercel Docs](https://vercel.com/docs)

---

_Archivo generado automáticamente para facilitar la integración de imágenes en producción._
