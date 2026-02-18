'use client';

import * as React from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  imageUrl: string;
  weight?: number;
  allowSlicing?: boolean;
  maxStock: number;
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({
  productId,
  productName,
  productSlug,
  price,
  imageUrl,
  weight,
  allowSlicing = true,
  maxStock,
  disabled = false,
  className,
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = React.useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const handleClick = () => {
    addItem({
      productId,
      name: productName,
      slug: productSlug,
      price,
      imageUrl,
      weight,
      sliced: allowSlicing,
      maxStock,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
    
    // Abrir el carrito después de agregar
    setTimeout(() => openCart(), 300);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      className={cn('w-full transition-all', className)}
      size="lg"
    >
      {isAdded ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          ¡Agregado!
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Agregar al carrito
        </>
      )}
    </Button>
  );
}
