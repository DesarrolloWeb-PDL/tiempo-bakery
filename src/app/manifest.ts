import { MetadataRoute } from 'next';
import { getThemeConfig } from '@/lib/app-theme';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const theme = await getThemeConfig();

  const timestamp = Date.now();

  return {
    name: theme.appTitle || 'Tiempo Bakery',
    short_name: (theme.appTitle || 'Tiempo Bakery').substring(0, 12),
    description: 'Micropanadería artesanal por encargo semanal. Panes y dulces elaborados en tandas pequeñas con fermentaciones lentas y producto real.',
    start_url: `/?v=${timestamp}`,
    display: 'standalone',
    background_color: theme.secondaryColor || '#2c2c2c',
    theme_color: theme.primaryColor || '#d89a44',
    orientation: 'portrait-primary',
    icons: [
      {
        src: `/api/icon?size=192&v=${timestamp}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/api/icon?size=512&v=${timestamp}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/api/icon?size=192&v=${timestamp}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: `/api/icon?size=512&v=${timestamp}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
  };
}
