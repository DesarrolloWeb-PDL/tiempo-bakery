'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import { useAppTheme } from '@/hooks/useAppTheme';

// Inyector de CSS de tema - integrado en Header para evitar error #418
function ThemeStyleInjector() {
  const { theme } = useAppTheme()

  React.useEffect(() => {
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

      .btn-primary, button[type="submit"]:not([class*="outline"]):not([class*="ghost"]) {
        background-color: var(--theme-primary);
        color: white;
      }

      .btn-primary:hover, button[type="submit"]:not([class*="outline"]):not([class*="ghost"]):hover {
        opacity: 0.9;
      }

      .text-primary, a.text-primary {
        color: var(--theme-primary);
      }

      .badge-default {
        background-color: var(--theme-primary);
      }
    `

    styleEl.textContent = css
  }, [theme])

  return null
}

export function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const toggleCart = useCartStore((state) => state.toggleCart);
  const { theme } = useAppTheme();

  return (
    <>
      <ThemeStyleInjector />
      <header 
      className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      style={{ borderColor: theme.primaryColor + '20' }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            {theme.logoUrl && (
              <img
                src={theme.logoUrl}
                alt={theme.appTitle}
                className="h-10 w-10 object-contain"
              />
            )}
            <div>
              <span 
                className="text-xl font-bold block leading-tight"
                style={{ color: theme.primaryColor }}
              >
                {theme.appTitle}
              </span>
              {theme.appSubtitle && (
                <span className="text-xs text-gray-500 block">
                  {theme.appSubtitle}
                </span>
              )}
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
            >
              Productos
            </Link>
            <Link
              href="/sobre-nosotros"
              className="text-sm font-medium text-gray-700 transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
            >
              Sobre Nosotros
            </Link>
            <Link
              href="/contacto"
              className="text-sm font-medium text-gray-700 transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
            >
              Contacto
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={toggleCart}
              style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
