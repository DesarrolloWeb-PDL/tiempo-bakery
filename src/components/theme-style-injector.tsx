'use client'

import { useAppTheme } from '@/hooks/useAppTheme'
import { useEffect } from 'react'

export function ThemeStyleInjector() {
  const { theme } = useAppTheme()

  useEffect(() => {
    // Crear o actualizar un style tag con variables CSS para los colores dinámicos
    let styleEl = document.getElementById('theme-styles')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'theme-styles'
      document.head.appendChild(styleEl)
    }

    const css = `
      :root {
        --theme-primary: ${theme.primaryColor};
        --theme-secondary: ${theme.secondaryColor};
        --theme-accent: ${theme.accentColor};
      }

      /* Botones primarios */
      .btn-primary, button[type="submit"]:not([class*="outline"]):not([class*="ghost"]) {
        background-color: var(--theme-primary);
        color: white;
      }

      .btn-primary:hover, button[type="submit"]:not([class*="outline"]):not([class*="ghost"]):hover {
        opacity: 0.9;
      }

      /* Enlaces y hover */
      .text-primary, a.text-primary {
        color: var(--theme-primary);
      }

      /* Badges por defecto */
      .badge-default {
        background-color: var(--theme-primary);
      }
    `

    styleEl.textContent = css
  }, [theme])

  return null
}
