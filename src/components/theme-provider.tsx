'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { hexToHsl } from '@/lib/hex-to-hsl'

export type ThemeSettings = {
  appTitle: string
  appSubtitle: string
  logoUrl: string
  primaryColor: string
  primaryHover: string
  secondaryColor: string
  accentColor: string
  bgBody: string
  bgCard: string
  textPrimary: string
  textMuted: string
  fontHeading: string
  fontBody: string
  fontSizeTitle: string
  logoSize: string
  titleAlign: string
  borderColor: string
  mutedBg: string
  hoverBg: string
  sidebarBg: string
  sidebarText: string
  successColor: string
  warningColor: string
  errorColor: string
  headerMaxWidth: string
}

export const DEFAULT_THEME: ThemeSettings = {
  appTitle: 'Tiempo Masa Madre',
  appSubtitle: 'Micropanadería artesanal por encargo semanal',
  logoUrl: '/img/espiga.png',
  primaryColor: '#D4A95A',
  primaryHover: '#C49A4A',
  secondaryColor: '#2C2C2C',
  accentColor: '#544A37',
  bgBody: '#3A352C',
  bgCard: '#2C2C2C',
  textPrimary: '#D4A95A',
  textMuted: '#9D804B',
  fontHeading: 'system-ui',
  fontBody: 'system-ui',
  fontSizeTitle: 'clamp(1rem, 2.5vw, 1.5rem)',
  logoSize: '36',
  titleAlign: 'left',
  borderColor: '#544A37',
  mutedBg: '#433D32',
  hoverBg: '#4D4535',
  sidebarBg: '#2C2C2C',
  sidebarText: '#D4A95A',
  successColor: '#10b981',
  warningColor: '#f59e0b',
  errorColor: '#ef4444',
  headerMaxWidth: '1280px',
}

const ThemeContext = createContext<ThemeSettings>(DEFAULT_THEME)

export const useTheme = () => useContext(ThemeContext)

const GOOGLE_FONTS_URLS: Record<string, string> = {
  "'Playfair Display', serif": 'family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap',
  "'Cormorant Garamond', serif": 'family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap',
  "'Libre Baskerville', serif": 'family=Libre+Baskerville:wght@400;700&display=swap',
  "'DM Serif Display', serif": 'family=DM+Serif+Display&display=swap',
  "'Lora', serif": 'family=Lora:ital,wght@0,400;0,600;1,400&display=swap',
  "'Lato', sans-serif": 'family=Lato:wght@400;700&display=swap',
  "'Montserrat', sans-serif": 'family=Montserrat:wght@300;400;600;700&display=swap',
  "'Open Sans', sans-serif": 'family=Open+Sans:wght@300;400;600;700&display=swap',
  "'Raleway', sans-serif": 'family=Raleway:wght@300;400;600;700&display=swap',
  "'Nunito', sans-serif": 'family=Nunito:wght@300;400;600;700&display=swap',
  "'Work Sans', sans-serif": 'family=Work+Sans:wght@300;400;600;700&display=swap',
}

function getGoogleFontsUrl(fontName: string): string | null {
  const entry = Object.entries(GOOGLE_FONTS_URLS).find(([key]) => key === fontName)
  return entry ? `https://fonts.googleapis.com/css2?${entry[1]}` : null
}

function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement

  root.style.setProperty('--brand-primary', theme.primaryColor)
  root.style.setProperty('--brand-primary-hover', theme.primaryHover)
  root.style.setProperty('--brand-secondary', theme.secondaryColor)
  root.style.setProperty('--brand-accent', theme.accentColor)
  root.style.setProperty('--brand-bg-body', theme.bgBody)
  root.style.setProperty('--brand-bg-card', theme.bgCard)
  root.style.setProperty('--brand-text-primary', theme.textPrimary)
  root.style.setProperty('--brand-text-muted', theme.textMuted)
  root.style.setProperty('--brand-border', theme.borderColor)
  root.style.setProperty('--brand-muted-bg', theme.mutedBg)
  root.style.setProperty('--brand-hover-bg', theme.hoverBg)
  root.style.setProperty('--brand-sidebar-bg', theme.sidebarBg)
  root.style.setProperty('--brand-sidebar-text', theme.sidebarText)
  root.style.setProperty('--brand-success', theme.successColor)
  root.style.setProperty('--brand-warning', theme.warningColor)
  root.style.setProperty('--brand-error', theme.errorColor)
  root.style.setProperty('--brand-font-heading', theme.fontHeading)
  root.style.setProperty('--brand-font-body', theme.fontBody)
  root.style.setProperty('--brand-font-size-title', theme.fontSizeTitle)
  root.style.setProperty('--brand-logo-size', `${theme.logoSize}px`)
  root.style.setProperty('--brand-header-max-width', theme.headerMaxWidth)

  const bgHsl = hexToHsl(theme.bgBody)
  const fgHsl = hexToHsl(theme.textPrimary)
  const cardHsl = hexToHsl(theme.bgCard)
  const primaryHsl = hexToHsl(theme.primaryColor)
  const secondaryHsl = hexToHsl(theme.accentColor)
  const mutedFgHsl = hexToHsl(theme.textMuted)
  const borderHsl = hexToHsl(theme.borderColor)
  const destructiveHsl = hexToHsl(theme.errorColor)

  root.style.setProperty('--background', bgHsl)
  root.style.setProperty('--foreground', fgHsl)
  root.style.setProperty('--card', cardHsl)
  root.style.setProperty('--card-foreground', fgHsl)
  root.style.setProperty('--popover', cardHsl)
  root.style.setProperty('--popover-foreground', fgHsl)
  root.style.setProperty('--primary', primaryHsl)
  root.style.setProperty('--primary-foreground', cardHsl)
  root.style.setProperty('--secondary', secondaryHsl)
  root.style.setProperty('--secondary-foreground', fgHsl)
  root.style.setProperty('--muted', hexToHsl(theme.mutedBg))
  root.style.setProperty('--muted-foreground', mutedFgHsl)
  root.style.setProperty('--accent', primaryHsl)
  root.style.setProperty('--accent-foreground', cardHsl)
  root.style.setProperty('--destructive', destructiveHsl)
  root.style.setProperty('--destructive-foreground', cardHsl)
  root.style.setProperty('--border', borderHsl)
  root.style.setProperty('--input', borderHsl)
  root.style.setProperty('--ring', primaryHsl)

  document.body.style.backgroundColor = theme.bgBody
  document.body.style.color = theme.textPrimary
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/tema')
      .then((r) => r.json())
      .then((data) => {
        setTheme((prev) => ({ ...prev, ...data }))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (!loaded) return
    applyTheme(theme)

    const googleUrl = getGoogleFontsUrl(theme.fontHeading) || getGoogleFontsUrl(theme.fontBody)
    if (googleUrl) {
      const existing = document.getElementById('theme-google-fonts')
      if (!existing) {
        const link = document.createElement('link')
        link.id = 'theme-google-fonts'
        link.rel = 'stylesheet'
        link.href = googleUrl
        document.head.appendChild(link)
      } else if (existing.getAttribute('href') !== googleUrl) {
        existing.setAttribute('href', googleUrl)
      }
    }
  }, [theme, loaded])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}
