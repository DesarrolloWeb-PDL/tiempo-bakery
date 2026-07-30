import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/admin-auth';

const GITHUB_REPO = 'DesarrolloWeb-PDL/img-tiempo-bakery';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BRANCH = 'main';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const cookies = { get: (name: string) => req.cookies.get(name) }
  const isAdmin = await hasAdminSession(cookies)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub token no configurado' }, { status: 500 })
  }

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded or invalid file type' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo JPG, PNG, WebP y AVIF.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'El archivo excede el tamaño máximo de 5MB' }, { status: 400 });
  }

  const fileName = `productos/${Date.now()}-${file.name}`;
  const fileBuffer = await file.arrayBuffer();

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add ${fileName}`,
        content: Buffer.from(fileBuffer).toString('base64'),
        branch: BRANCH,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error al subir la imagen:', error);
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    const fileUrl = data.content.html_url;

    console.log('Imagen subida exitosamente:', fileUrl);
    return NextResponse.json({ url: fileUrl });
  } catch (err) {
    console.error('Error inesperado:', err);
    return NextResponse.json({ error: 'Error inesperado al subir la imagen' }, { status: 500 });
  }
}