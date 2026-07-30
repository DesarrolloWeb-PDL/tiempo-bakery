'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import { useTheme } from '@/components/theme-provider';
import { normalizePublicAssetUrl } from '@/lib/url-normalizer';
import type { SiteContent } from '@/lib/site-content.shared';

interface HeaderProps {
  showCart?: boolean;
  siteContent: SiteContent
}

export function Header({ siteContent, showCart = true }: HeaderProps) {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const toggleCart = useCartStore((state) => state.toggleCart);
  const theme = useTheme();
  const logoSrc = normalizePublicAssetUrl(theme.logoUrl) || '/img/espiga.png';
  const logoIsExternal = /^https?:\/\//i.test(logoSrc);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => { setIsHydrated(true); }, []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const safeTotalItems = isHydrated ? totalItems : 0;

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b transition-all duration-300 backdrop-blur-xl"
      style={{
        backgroundColor: scrolled ? 'rgba(44, 44, 44, 0.85)' : 'rgba(44, 44, 44, 0.6)',
        borderColor: theme.primaryColor + '30',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 min-w-0 max-w-[60%] sm:max-w-none">
            {theme.logoUrl && (
              <Image
                src={logoSrc}
                alt={theme.appTitle}
                className="object-contain shrink-0"
                style={{ width: 'var(--brand-logo-size)', height: 'var(--brand-logo-size)', maxWidth: '35vw' }}
                width={Number(theme.logoSize) || 36}
                height={Number(theme.logoSize) || 36}
                unoptimized={logoIsExternal}
              />
            )}
            <div className="min-w-0 truncate" style={{ textAlign: theme.titleAlign as any }}>
              <span
                className="font-bold block leading-tight truncate"
                style={{ color: theme.primaryColor, fontSize: theme.fontSizeTitle, fontFamily: theme.fontHeading }}
              >
                {theme.appTitle}
              </span>
              {theme.appSubtitle && (
                <span className="text-[10px] sm:text-xs truncate block" style={{ color: theme.textMuted }}>
                  {theme.appSubtitle}
                </span>
              )}
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
            >
              {siteContent.navProductsLabel}
            </Link>
            <Link
              href="/sobre-nosotros"
              className="text-sm font-medium transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
            >
              {siteContent.navAboutLabel}
            </Link>
            <Link
              href="/contacto"
              className="text-sm font-medium transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
            >
              {siteContent.navContactLabel}
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {showCart && (
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={toggleCart}
                style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
              >
                <ShoppingCart className="h-5 w-5" />
                {safeTotalItems > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    style={{ backgroundColor: theme.primaryColor, color: '#2C2C2C' }}
                  >
                    {safeTotalItems}
                  </Badge>
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              style={{ color: theme.primaryColor }}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t py-4 flex flex-col gap-3" style={{ borderColor: theme.primaryColor + '30' }}>
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
  );
}
