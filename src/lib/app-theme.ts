import { prisma as db } from '@/lib/db'
import { normalizePublicAssetUrl } from '@/lib/url-normalizer'

export interface AppTheme {
  appTitle: string
  appSubtitle: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  infoTitle1: string
  infoSubtitle1: string
  infoTitle2: string
  infoSubtitle2: string
  infoTitle3: string
  infoSubtitle3: string
}

const DEFAULT_THEME: AppTheme = {
  appTitle: 'Tiempo Bakery',
  appSubtitle: 'Micropanadería artesanal por encargo semanal',
  logoUrl: '/img/espiga.png',
  primaryColor: '#d89a44',
  secondaryColor: '#2c2c2c',
  accentColor: '#f5f5f5',
  infoTitle1: 'Preventa Semanal',
  infoSubtitle1: 'Pedidos de miércoles a domingo. Entrega en fin de semana.',
  infoTitle2: 'Masa Madre Natural',
  infoSubtitle2: 'Sin levadura industrial. Fermentación lenta y natural.',
  infoTitle3: 'Retirada Local',
  infoSubtitle3: 'Puntos de retirada en Utrera o envío a domicilio.',
}

export async function getThemeConfig(): Promise<AppTheme> {
  try {
    const configs = await db.siteConfig.findMany({
      where: {
        key: {
          in: [
            'theme_appTitle',
            'theme_appSubtitle',
            'theme_logoUrl',
            'theme_primaryColor',
            'theme_secondaryColor',
            'theme_accentColor',
            'theme_infoTitle1',
            'theme_infoSubtitle1',
            'theme_infoTitle2',
            'theme_infoSubtitle2',
            'theme_infoTitle3',
            'theme_infoSubtitle3',
          ],
        },
      },
    })

    const theme: Partial<AppTheme> = {}
    configs.forEach((config) => {
      const key = config.key.replace('theme_', '') as keyof AppTheme
      ;(theme as any)[key] = config.value
    })

    const mergedTheme = { ...DEFAULT_THEME, ...theme }
    return {
      ...mergedTheme,
      logoUrl: normalizePublicAssetUrl(mergedTheme.logoUrl),
    }
  } catch (error) {
    console.error('Error fetching theme config:', error)
    return DEFAULT_THEME
  }
}
