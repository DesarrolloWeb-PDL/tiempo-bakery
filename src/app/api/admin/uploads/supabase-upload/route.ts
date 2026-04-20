import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge'; // Opcional: para Next.js edge functions

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  const productId = formData.get('productId'); // opcional, para asociar

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
  }

  const fileExt = (file as File).name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  // Subir a Supabase Storage
  const { data, error } = await supabase.storage
    .from('productos')
    .upload(fileName, file as File, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Obtener URL pública
  const publicUrl = supabase.storage.from('productos').getPublicUrl(fileName).data.publicUrl;

  // Acá podrías guardar la URL y productId en la base de datos si querés

  return NextResponse.json({ url: publicUrl, fileName });
}
