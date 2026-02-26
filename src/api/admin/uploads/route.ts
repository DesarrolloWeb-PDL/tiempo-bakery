import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo.' }, { status: 400 });
    }

    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: 'uploads',
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