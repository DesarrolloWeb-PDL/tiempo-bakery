import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

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
	const uploadDir = path.join(process.cwd(), 'public', 'images', 'productos');
	const filePath = path.join(uploadDir, filename);

	const buffer = Buffer.from(await file.arrayBuffer());
	await fs.writeFile(filePath, buffer);

	// Devolver la ruta relativa para guardar en la BD
	return NextResponse.json({ imageUrl: `/images/productos/${filename}` });
}