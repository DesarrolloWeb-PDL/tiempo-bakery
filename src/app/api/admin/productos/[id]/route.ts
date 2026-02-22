import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
	const { imageUrl } = await req.json();
	if (!imageUrl) {
		return NextResponse.json({ error: 'Falta imageUrl.' }, { status: 400 });
	}
	const product = await prisma.product.update({
		where: { id: params.id },
		data: { imageUrl },
	});
	return NextResponse.json(product);
}