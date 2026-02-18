import { prisma as db } from '@/lib/db'

export interface AppTheme {
  appTitle: string
  appSubtitle: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

const DEFAULT_THEME: AppTheme = {
  appTitle: 'Tiempo Bakery',
  appSubtitle: 'Panadería artesanal con preventa semanal',
  logoUrl: '/img/espiga.png',
  primaryColor: '#d89a44',
  secondaryColor: '#2c2c2c',
  accentColor: '#f5f5f5',
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
          ],
        },
      },
    })

    const theme: Partial<AppTheme> = {}
    configs.forEach((config) => {
      const key = config.key.replace('theme_', '') as keyof AppTheme
      ;(theme as any)[key] = config.value
    })

    return { ...DEFAULT_THEME, ...theme }
  } catch (error) {
    console.error('Error fetching theme config:', error)
    return DEFAULT_THEME
  }
}
