import { NextRequest, NextResponse } from 'next/server';
import stream from 'stream';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo válido.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const readableStream = new stream.Readable();
    readableStream.push(Buffer.from(buffer));
    readableStream.push(null);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({
        folder: 'uploads',
      }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });

      readableStream.pipe(uploadStream);
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