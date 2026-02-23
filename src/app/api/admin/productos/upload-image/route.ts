import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export const runtime = 'nodejs';

function isCloudinaryConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

async function uploadToCloudinaryBuffer(buffer: Buffer, filename: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'tiempo-bakery/productos';
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash('sha1').update(toSign).digest('hex');

  const formData = new FormData();
  formData.append('file', new Blob([buffer]), filename);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({} as Record<string, unknown>));
  if (!response.ok || typeof data.secure_url !== 'string') {
    throw new Error('No se pudo subir la imagen a Cloudinary');
  }
  return data.secure_url;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  const productId = formData.get('productId');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No se envió archivo.' }, { status: 400 });
  }
  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ error: 'Falta productId.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const filename = `${productId}_${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isCloudinaryConfigured()) {
    try {
      const url = await uploadToCloudinaryBuffer(buffer, filename);
      return NextResponse.json({ imageUrl: url });
    } catch (error) {
      return NextResponse.json({ error: 'Error al subir a Cloudinary' }, { status: 500 });
    }
  }

  // Fallback local (solo para desarrollo)
  const uploadDir = path.join(process.cwd(), 'public', 'images', 'productos');
  const filePath = path.join(uploadDir, filename);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  // Devolver la ruta relativa para guardar en la BD
  return NextResponse.json({ imageUrl: `/images/productos/${filename}` });
}