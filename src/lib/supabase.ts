import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://gpawfssawmjkwhkqnqjj.supabase.co';
const FALLBACK_SUPABASE_KEY = 'sb_publishable_SSWH9GUfoZDG6-1Bod8lyg_oAiKr_Ts';
const STORAGE_BUCKET = 'productos';

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
	process.env.SUPABASE_URL?.trim() ||
	FALLBACK_SUPABASE_URL;

const supabaseKey =
	process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
	process.env.SUPABASE_ANON_KEY?.trim() ||
	FALLBACK_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
	const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

	const { error } = await supabase.storage
		.from(STORAGE_BUCKET)
		.upload(filePath, file, {
			cacheControl: '3600',
			upsert: false,
			contentType: file.type || undefined,
		});

	if (error) {
		throw new Error(error.message);
	}

	const {
		data: { publicUrl },
	} = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

	return {
		filePath,
		publicUrl,
	};
}