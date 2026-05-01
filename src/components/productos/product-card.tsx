'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from './add-to-cart-button';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  weight?: number;
  imageUrl: string;
  imageAlt: string;
  images?: Array<{
    url: string;
    altText?: string | null;
    order: number;
  }>;
  allergens: string[];
  stock: {
    available: number;
    hasStock: boolean;
    lowStock?: boolean;
  };
  category: {
    name: string;
  };
}

export function ProductCard({
  id,
  name,
  slug,
  description,
  price,
  weight,
  imageUrl,
  imageAlt,
  images = [],
  allergens,
  stock,
  category,
}: ProductCardProps) {
  const { theme } = useAppTheme()
  const normalizeImageUrl = (value: string) => {
    if (!value) return '/img/espiga.png'
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

  const galleryImages = React.useMemo(() => {
    const primary = {
      url: normalizeImageUrl(imageUrl),
      altText: imageAlt,
      order: 0,
    }

    const extras = images
      .filter((image) => image.order > 0)
      .map((image) => ({
        url: normalizeImageUrl(image.url),
        altText: image.altText || imageAlt,
        order: image.order,
      }))

    return [primary, ...extras]
  }, [imageAlt, imageUrl, images])

  const [activeImageIndex, setActiveImageIndex] = React.useState(0)
  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0]

  React.useEffect(() => {
    setActiveImageIndex(0)
  }, [galleryImages])

  const showPreviewImage = (index: number) => {
    if (!galleryImages[index]) return
    setActiveImageIndex(index)
  }

  const showNextMobileImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (galleryImages.length <= 1) return
    setActiveImageIndex((currentIndex) => (currentIndex + 1) % galleryImages.length)
  }

  return (
    <Card className="group flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/productos/${slug}`} className="block">
        <div
          className="relative h-48 w-full bg-gray-100"
          onMouseEnter={() => {
            if (galleryImages[1]) {
              showPreviewImage(1)
            }
          }}
          onMouseLeave={() => showPreviewImage(0)}
        >
          <Image
            src={activeImage?.url ?? '/img/espiga.png'}
            alt={activeImage?.altText || imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setActiveImageIndex(0)}
          />
          {galleryImages.length > 1 && (
            <>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[11px] text-white">
                <span>{galleryImages.length}</span>
                <span>fotos</span>
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 md:hidden">
                {galleryImages.map((_, index) => (
                  <span
                    key={`dot-${index}`}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      index === activeImageIndex ? 'bg-amber-600' : 'bg-gray-400'
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={showNextMobileImage}
                className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-xs font-medium text-white md:hidden"
              >
                Ver otra foto
              </button>
            </>
          )}
          {stock.lowStock && stock.hasStock && (
            <Badge
              variant="warning"
              className="absolute top-2 right-2"
            >
              ¡Últimas unidades!
            </Badge>
          )}
          {!stock.hasStock && (
            <Badge
              variant="destructive"
        const shiftMobileImage = (event: React.MouseEvent<HTMLButtonElement>, direction: -1 | 1) => {
            >
              Agotado
            </Badge>
          setActiveImageIndex((currentIndex) => {
            const nextIndex = currentIndex + direction
            if (nextIndex < 0) {
              return galleryImages.length - 1
            }

            if (nextIndex >= galleryImages.length) {
              return 0
            }

            return nextIndex
          })
        </div>
      </Link>

      <CardHeader className="pb-3">
            <div
              className="relative h-48 w-full bg-gray-100"
              onMouseEnter={() => {
                if (galleryImages[1]) {
                  showPreviewImage(1)
                }
              }}
              onMouseLeave={() => showPreviewImage(0)}
            >
              <Link href={`/productos/${slug}`} aria-label={`Ver detalle de ${name}`} className="absolute inset-0 z-10" />
              <Image
                src={activeImage?.url ?? '/img/espiga.png'}
                alt={activeImage?.altText || imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setActiveImageIndex(0)}
              />
              {galleryImages.length > 1 && (
                <>
                  <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[11px] text-white">
                    <span>{galleryImages.length}</span>
                    <span>fotos</span>
                  </div>
                  <div className="absolute bottom-2 right-2 z-20 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-700 md:hidden">
                    {activeImageIndex + 1} / {galleryImages.length}
                  </div>
                  <div className="absolute inset-x-0 bottom-10 z-20 flex justify-center gap-1 md:hidden">
                    {galleryImages.map((_, index) => (
                      <span
                        key={`dot-${index}`}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full bg-white/65 transition-all',
                          index === activeImageIndex ? 'w-4 bg-white' : 'bg-white/65'
                        )}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-y-0 left-0 z-20 flex items-center pl-2 md:hidden">
                    <button
                      type="button"
                      onClick={(event) => shiftMobileImage(event, -1)}
                      className="rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-black/55"
                      aria-label={`Ver foto anterior de ${name}`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute inset-y-0 right-0 z-20 flex items-center pr-2 md:hidden">
                    <button
                      type="button"
                      onClick={(event) => shiftMobileImage(event, 1)}
                      className="rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-black/55"
                      aria-label={`Ver foto siguiente de ${name}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
              {stock.lowStock && stock.hasStock && (
                <Badge
                  variant="warning"
                  className="absolute top-2 right-2 z-20"
                >
                  ¡Últimas unidades!
                </Badge>
              )}
              {!stock.hasStock && (
                <Badge
                  variant="destructive"
                  className="absolute top-2 right-2 z-20"
                >
                  Agotado
                </Badge>
              )}
            </div>
    </Card>
  );
}
