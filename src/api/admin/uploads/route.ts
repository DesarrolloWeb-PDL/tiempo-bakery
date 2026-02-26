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