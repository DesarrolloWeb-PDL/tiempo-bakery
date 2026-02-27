import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo válido.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    const uploadResult = await new Promise<any>((resolve, reject) => {
      // Eliminar cualquier lógica restante relacionada con Readable o WritableStream
      // ...existing code...
    });

    return NextResponse.json({
      message: 'Imagen subida con éxito.',
      url: uploadResult.secure_url,
    });
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    return NextResponse.json({ error: 'Error al subir la imagen.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('file');

  if (!fileName) {
    return NextResponse.json({ error: 'No se especificó ningún archivo.' }, { status: 400 });
  }

  try {
    const fileUrl = `https://raw.githubusercontent.com/DesarrolloWeb-PDL/img-tiempo-bakery/main/productos/${fileName}`;
    return NextResponse.redirect(fileUrl);
  } catch (error) {
    console.error('Error al redirigir a la imagen:', error);
    return NextResponse.json({ error: 'Error al redirigir a la imagen.' }, { status: 500 });
  }
}