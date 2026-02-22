'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function CartSidebar() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    updateSliced,
    getSubtotal,
  } = useCartStore();

  const subtotal = getSubtotal();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
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
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tu carrito está vacío
            </h3>
            <p className="text-sm text-gray-500 mb-6">
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
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-white">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/productos/${item.slug}`}
                      onClick={closeCart}
                      className="font-medium text-sm hover:text-amber-700 transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>

                    {item.weight && (
                      <p className="text-xs text-gray-500 mt-1">
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
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-600"
                      />
                      <label
                        htmlFor={`sliced-${item.productId}`}
                        className="text-xs text-gray-600 cursor-pointer"
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
                        <span className="text-sm font-semibold text-amber-700">
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
            <div className="border-t border-gray-200 p-4 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Subtotal
                </span>
                <span className="text-xl font-bold text-amber-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <p className="text-xs text-gray-500">
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
