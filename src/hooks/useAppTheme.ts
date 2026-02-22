'use client'

import { useEffect, useState, useRef } from 'react'

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

function normalizeThemeUrl(value: string) {
  if (!value) return value
  try {
    const parsed = new URL(value)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return parsed.pathname + parsed.search
    }
    return value
  } catch {
    return value
  }
}

let cachedTheme: AppTheme | null = null

export function useAppTheme() {
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    // Evitar múltiples fetches
    if (fetchedRef.current) return
    fetchedRef.current = true

    // Si ya tenemos cached, usar eso
    if (cachedTheme) {
      setTheme(cachedTheme)
      setLoading(false)
      return
    }

    const fetchTheme = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/admin/tema', { 
          cache: 'no-store',
          next: { revalidate: 60 } 
        })
        
        if (!res.ok) {
          console.warn(`Theme API returned ${res.status}`)
          throw new Error('Error fetching theme')
        }
        
        const data = await res.json()
        const finalTheme = {
          ...DEFAULT_THEME,
          ...data,
          logoUrl: normalizeThemeUrl((data as AppTheme).logoUrl ?? DEFAULT_THEME.logoUrl),
        }
        cachedTheme = finalTheme
        setTheme(finalTheme)
      } catch (err) {
        console.error('Error fetching theme:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar el tema')
        setTheme(DEFAULT_THEME)
        cachedTheme = DEFAULT_THEME
      } finally {
        setLoading(false)
      }
    }

    void fetchTheme()
  }, [])

  return { theme, loading, error }
}
