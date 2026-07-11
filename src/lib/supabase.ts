import { put } from '@vercel/blob';

function getExtension(fileName: string, mimeType: string) {
	const byMime: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
		'image/gif': 'gif',
		'image/svg+xml': 'svg',
	};

	const rawExt = fileName.split('.').pop()?.toLowerCase();
	if (rawExt) return rawExt;
	return byMime[mimeType] ?? 'jpg';
}

export async function uploadPublicAsset(file: File, folder: string) {
	const ext = getExtension(file.name, file.type);
	const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
	const filepath = `${folder}/${filename}`;

	const blob = await put(filepath, file, {
		access: 'public',
		addRandomSuffix: false,
	});

	return {
		filePath: blob.pathname,
		publicUrl: blob.url,
	};
}