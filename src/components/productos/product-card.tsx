'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from './add-to-cart-button';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

function normalizeImageUrl(value: string) {
  if (!value) return '/img/espiga.png';

  try {
    const parsed = new URL(value);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${parsed.pathname}${parsed.search}`;
    }

    return value;
  } catch {
    return value;
  }
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
  const galleryImages = React.useMemo(() => {
    const primary = {
      url: normalizeImageUrl(imageUrl),
      altText: imageAlt,
      order: 0,
    };

    const extras = images
      .filter((image) => image.order > 0)
      .map((image) => ({
        url: normalizeImageUrl(image.url),
        altText: image.altText || imageAlt,
        order: image.order,
      }));

    return [primary, ...extras];
  }, [imageAlt, imageUrl, images]);

  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0];

  React.useEffect(() => {
    setActiveImageIndex(0);
  }, [galleryImages]);

  const showPreviewImage = (index: number) => {
    if (!galleryImages[index]) return;
    setActiveImageIndex(index);
  };

  const shiftMobileImage = (
    event: React.MouseEvent<HTMLButtonElement>,
    direction: -1 | 1,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (galleryImages.length <= 1) return;

    setActiveImageIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0) {
        return galleryImages.length - 1;
      }

      if (nextIndex >= galleryImages.length) {
        return 0;
      }

      return nextIndex;
    });
  };

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div
        className="relative h-48 w-full bg-gray-100"
        onMouseEnter={() => {
          if (galleryImages[1]) {
            showPreviewImage(1);
          }
        }}
        onMouseLeave={() => showPreviewImage(0)}
      >
        <Link
          href={`/productos/${slug}`}
          aria-label={`Ver detalle de ${name}`}
          className="absolute inset-0 z-10"
        >
          <span className="sr-only">Ver detalle de {name}</span>
        </Link>

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
                    index === activeImageIndex ? 'w-4 bg-white' : 'bg-white/65',
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
          <Badge variant="warning" className="absolute right-2 top-2 z-20">
            ¡Últimas unidades!
          </Badge>
        )}

        {!stock.hasStock && (
          <Badge variant="destructive" className="absolute right-2 top-2 z-20">
            Agotado
          </Badge>
        )}
      </div>

      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
              {category.name}
            </p>
            <Link href={`/productos/${slug}`} className="relative z-10 block">
              <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-amber-800">
                {name}
              </h3>
            </Link>
          </div>

          {weight != null && weight > 0 && (
            <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
              {weight} g
            </Badge>
          )}
        </div>

        <p className="text-2xl font-bold text-gray-900">{formatCurrency(price)}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        <p className="line-clamp-3 text-sm leading-6 text-gray-600">{description}</p>

        {allergens.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allergens.slice(0, 3).map((allergen) => (
              <Badge key={allergen} variant="outline" className="text-xs">
                {allergen}
              </Badge>
            ))}
            {allergens.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{allergens.length - 3}
              </Badge>
            )}
          </div>
        )}

        {stock.hasStock && stock.available < 999 && (
          <p className="text-sm text-gray-500">{stock.available} disponibles</p>
        )}
      </CardContent>

      <CardFooter className="mt-auto pt-0">
        <AddToCartButton
          productId={id}
          productName={name}
          productSlug={slug}
          price={price}
          imageUrl={activeImage?.url ?? normalizeImageUrl(imageUrl)}
          weight={weight}
          maxStock={Math.max(stock.available, 1)}
          disabled={!stock.hasStock}
        />
      </CardFooter>
    </Card>
  );
}
