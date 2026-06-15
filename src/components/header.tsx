'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import { useAppTheme } from '@/hooks/useAppTheme';
import { normalizePublicAssetUrl } from '@/lib/url-normalizer';
import type { SiteContent } from '@/lib/site-content.shared';

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

interface HeaderProps {
  siteContent: SiteContent
}

export function Header({ siteContent }: HeaderProps) {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const toggleCart = useCartStore((state) => state.toggleCart);
  const { theme } = useAppTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
          <Link href="/" className="flex items-center space-x-2 min-w-0">
            {theme.logoUrl && (
              <Image
                src={normalizePublicAssetUrl(theme.logoUrl) || '/img/espiga.png'}
                alt={theme.appTitle}
                className="h-9 w-9 shrink-0 object-contain"
                width={36}
                height={36}
              />
            )}
            <div className="min-w-0">
              <span 
                className="text-base md:text-xl font-bold block leading-tight truncate"
                style={{ color: theme.primaryColor }}
              >
                {theme.appTitle}
              </span>
              {theme.appSubtitle && (
                <span className="hidden sm:block text-xs text-gray-500 truncate">
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
              {siteContent.navProductsLabel}
            </Link>
            <Link
              href="/sobre-nosotros"
              className="text-sm font-medium text-gray-700 transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
            >
              {siteContent.navAboutLabel}
            </Link>
            <Link
              href="/contacto"
              className="text-sm font-medium text-gray-700 transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
            >
              {siteContent.navContactLabel}
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
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Nav Panel */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t py-4 flex flex-col gap-3" style={{ borderColor: theme.primaryColor + '20' }}>
            <Link
              href="/"
              className="text-sm font-medium px-1 py-1 transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {siteContent.navProductsLabel}
            </Link>
            <Link
              href="/sobre-nosotros"
              className="text-sm font-medium px-1 py-1 transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {siteContent.navAboutLabel}
            </Link>
            <Link
              href="/contacto"
              className="text-sm font-medium px-1 py-1 transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {siteContent.navContactLabel}
            </Link>
          </nav>
        )}
      </div>
    </header>
    </>
  );
}
