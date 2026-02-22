'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from './add-to-cart-button';
import { useAppTheme } from '@/hooks/useAppTheme';

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

  const [cardImageUrl, setCardImageUrl] = React.useState(() => normalizeImageUrl(imageUrl))

  React.useEffect(() => {
    setCardImageUrl(normalizeImageUrl(imageUrl))
  }, [imageUrl])

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/productos/${slug}`} className="block">
        <div className="relative h-48 w-full bg-gray-100">
          <Image
            src={cardImageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setCardImageUrl('/img/espiga.png')}
          />
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
              className="absolute top-2 right-2"
            >
              Agotado
            </Badge>
          )}
        </div>
      </Link>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/productos/${slug}`}>
            <h3 
              className="font-semibold text-lg transition-colors hover:opacity-75"
              style={{ color: theme.primaryColor }}
            >
              {name}
            </h3>
          </Link>
          <Badge variant="secondary" className="shrink-0">
            {category.name}
          </Badge>
        </div>
        {weight && (
          <p className="text-sm text-gray-500">{weight}g</p>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        
        {allergens.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {allergens.map((allergen) => (
              <Badge
                key={allergen}
                variant="outline"
                className="text-xs"
              >
                {allergen}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-0">
        <div className="flex items-center justify-between w-full">
          <span 
            className="text-2xl font-bold"
            style={{ color: theme.primaryColor }}
          >
            {formatCurrency(price)}
          </span>
          {stock.hasStock && (
            <span className="text-sm text-gray-500">
              {stock.available} disponibles
            </span>
          )}
        </div>
        
        <AddToCartButton
          productId={id}
          productName={name}
          productSlug={slug}
          price={price}
          imageUrl={imageUrl}
          weight={weight}
          maxStock={stock.available}
          disabled={!stock.hasStock}
        />
      </CardFooter>
    </Card>
  );
}
