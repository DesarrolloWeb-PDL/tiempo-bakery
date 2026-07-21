'use client'

import { useEffect, useState, createContext, useContext } from 'react'

type ThemeSettings = {
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
}

const DEFAULT_THEME: ThemeSettings = {
  appTitle: 'Tiempo Bakery',
  appSubtitle: 'Micropanadería artesanal por encargo semanal',
  logoUrl: '/img/espiga.png',
  primaryColor: '#d2a859',
  primaryHover: '#b8923a',
  secondaryColor: '#2c2c2c',
  accentColor: '#f5f5f5',
  bgBody: '#f0ede8',
  bgCard: '#ffffff',
  textPrimary: '#212429',
  textMuted: '#6b7280',
  fontHeading: 'system-ui',
  fontBody: 'system-ui',
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

    const root = document.documentElement
    root.style.setProperty('--brand-primary', theme.primaryColor)
    root.style.setProperty('--brand-primary-hover', theme.primaryHover)
    root.style.setProperty('--brand-secondary', theme.secondaryColor)
    root.style.setProperty('--brand-accent', theme.accentColor)
    root.style.setProperty('--brand-bg-body', theme.bgBody)
    root.style.setProperty('--brand-bg-card', theme.bgCard)
    root.style.setProperty('--brand-text-primary', theme.textPrimary)
    root.style.setProperty('--brand-text-muted', theme.textMuted)
    root.style.setProperty('--brand-font-heading', theme.fontHeading)
    root.style.setProperty('--brand-font-body', theme.fontBody)

    document.body.style.backgroundColor = theme.bgBody
    document.body.style.color = theme.textPrimary

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
