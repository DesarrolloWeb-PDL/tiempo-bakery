import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-auth';
import { uploadPublicAsset } from '@/lib/supabase';

export const runtime = 'edge'; // Opcional: para Next.js edge functions

export async function POST(req: NextRequest) {
  if (!hasAdminSession(req.cookies)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
  }

  try {
    const upload = await uploadPublicAsset(file as File, 'productos');
    return NextResponse.json({ url: upload.publicUrl, filePath: upload.filePath });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo subir la imagen' },
      { status: 500 }
    );
  }
}
