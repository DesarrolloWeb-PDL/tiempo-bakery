'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import { normalizePublicAssetUrl } from '@/lib/url-normalizer';
import { cn } from '@/lib/utils';

function shouldSkipOptimization(url: string) {
  return url.includes('.supabase.co/storage/v1/object/public/');
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function CartSidebar() {
  const pathname = usePathname();
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    updateSliced,
    getSubtotal,
  } = useCartStore();
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const safeItems = isHydrated ? items : [];
  const safeIsOpen = isHydrated ? isOpen : false;

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const subtotal = isHydrated
    ? getSubtotal()
    : 0;

  return (
    <>
      {/* Overlay */}
      {safeIsOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full md:w-96 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col',
          safeIsOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ backgroundColor: 'var(--brand-bg-card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--brand-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--brand-text-primary)' }}>
            Tu Carrito
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCart}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        {safeItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-16 w-16 mb-4" style={{ color: 'var(--brand-text-muted)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--brand-text-primary)' }}>
              Tu carrito está vacío
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--brand-text-muted)' }}>
              ¡Agrega algunos productos para empezar!
            </p>
            <Button onClick={closeCart}>
              Ir a comprar
            </Button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {safeItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--brand-muted-bg)' }}
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden" style={{ backgroundColor: 'var(--brand-secondary)' }}>
                    <Image
                      src={normalizePublicAssetUrl(item.imageUrl) || '/img/espiga.png'}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized={shouldSkipOptimization(normalizePublicAssetUrl(item.imageUrl) || '')}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/productos/${item.slug}`}
                      onClick={closeCart}
                      className="font-medium text-sm hover:text-brand-gold-dark transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>

                    {item.weight && (
                      <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>
                        {item.weight}g
                      </p>
                    )}

                    {/* Sliced Toggle */}
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id={`sliced-${item.productId}`}
                        checked={item.sliced}
                        onChange={(e) =>
                          updateSliced(item.productId, e.target.checked)
                        }
                        className="rounded border-[var(--brand-border)] text-brand-gold focus:ring-brand-gold"
                      />
                      <label
                        htmlFor={`sliced-${item.productId}`}
                        className="text-xs cursor-pointer"
                        style={{ color: 'var(--brand-text-muted)' }}
                      >
                        Rebanado
                      </label>
                    </div>

                    {/* Quantity + Price */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.maxStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-gold-dark">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Stock Warning */}
                    {item.quantity >= item.maxStock && (
                      <Badge variant="warning" className="mt-2 text-xs">
                        Stock máximo alcanzado
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t p-4 space-y-4" style={{ borderColor: 'var(--brand-border)' }}>
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--brand-text-primary)' }}>
                  Subtotal
                </span>
                <span className="text-xl font-bold text-brand-gold-dark">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                Los gastos de envío se calcularán en el checkout
              </p>

              {/* Checkout Button */}
              <Link href="/checkout" onClick={closeCart}>
                <Button className="w-full" size="lg">
                  Proceder al Checkout
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full"
                onClick={closeCart}
              >
                Seguir comprando
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
