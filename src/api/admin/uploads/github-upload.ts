import { NextResponse } from 'next/server';

const GITHUB_REPO = 'DesarrolloWeb-PDL/img-tiempo-bakery'; // Reemplaza con tu repositorio
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Configura este token en tus variables de entorno
const BRANCH = 'main';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded or invalid file type' }, { status: 400 });
  }

  const fileName = `productos/${Date.now()}-${file.name}`;
  const fileContent = await file.text();

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add ${fileName}`,
        content: Buffer.from(fileContent).toString('base64'),
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