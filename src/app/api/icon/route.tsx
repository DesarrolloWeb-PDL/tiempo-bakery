import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getThemeConfig } from '@/lib/app-theme';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get('size') || '192');

    const theme = await getThemeConfig();

    const baseUrl = process.env.NEXT_PUBLIC_URL || new URL(request.url).origin;
    let logoUrl = '';
    if (theme.logoUrl) {
      if (/^https?:\/\//i.test(theme.logoUrl)) {
        logoUrl = theme.logoUrl;
      } else if (theme.logoUrl.startsWith('/')) {
        logoUrl = `${baseUrl}${theme.logoUrl}`;
      }
    }

    const primaryColor = theme.primaryColor || '#d4a95a';
    const secondaryColor = theme.secondaryColor || '#383333';
    const appTitle = theme.appTitle || 'Tiempo Masa Madre';

    const response = new ImageResponse(
      (
        <div
          style={{
            background: secondaryColor,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              width={size * 0.4}
              height={size * 0.4}
              style={{
                objectFit: 'contain',
              }}
            />
          ) : (
            <div style={{ fontSize: size * 0.4, fontWeight: 'bold' }}>🥖</div>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: size * 0.05,
            }}
          >
            <div
              style={{
                fontSize: size * 0.16,
                fontWeight: 'bold',
                color: primaryColor,
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              Tiempo
            </div>
            <div
              style={{
                fontSize: size * 0.12,
                fontWeight: 'bold',
                color: primaryColor,
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              Masa Madre
            </div>
          </div>
        </div>
      ),
      {
        width: size,
        height: size,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

    return response;
  } catch (e) {
    console.error('Error generating icon:', e);
    return new Response('Error generating icon', { status: 500 });
  }
}
