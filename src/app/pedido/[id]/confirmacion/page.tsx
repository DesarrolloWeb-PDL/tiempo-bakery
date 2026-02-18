'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, MapPin, Truck, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sliced: boolean;
  product: {
    name: string;
    imageUrl: string;
    weight?: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  paidAt?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  pickupLocation?: string;
  pickupAddress?: string;
  pickupSchedule?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostal?: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  customerNotes?: string;
  items: OrderItem[];
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const sessionId = searchParams.get('session_id');

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!orderId) return;

    fetch(`/api/pedidos/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar el pedido');
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <CardTitle>Error</CardTitle>
            </div>
            <CardDescription>
              {error || 'No se pudo encontrar el pedido'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Volver a la tienda</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deliveryIcons = {
    PICKUP_POINT: MapPin,
    LOCAL_DELIVERY: Truck,
    NATIONAL_COURIER: Package,
  };

  const deliveryNames = {
    PICKUP_POINT: 'Recogida en punto',
    LOCAL_DELIVERY: 'Envío local',
    NATIONAL_COURIER: 'Mensajería nacional',
  };

  const DeliveryIcon = deliveryIcons[order.deliveryMethod as keyof typeof deliveryIcons];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pedido confirmado!
          </h1>
          <p className="text-lg text-gray-600">
            Gracias por tu compra, {order.customerName}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Número de pedido: <strong>{order.orderNumber}</strong>
          </p>
        </div>

        {/* Email Confirmation Notice */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              📧 Hemos enviado un email de confirmación a{' '}
              <strong>{order.customerEmail}</strong> con todos los detalles de tu
              pedido.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detalles principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos */}
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-gray-100">
                        <Image
                          src={item.product.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.productName}</h3>
                        {item.product.weight && (
                          <p className="text-sm text-gray-500">
                            {item.product.weight}g
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            x{item.quantity}
                          </Badge>
                          {item.sliced && (
                            <Badge variant="outline" className="text-xs">
                              Rebanado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.unitPrice)}/ud
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Método de entrega */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {DeliveryIcon && <DeliveryIcon className="h-5 w-5" />}
                  Método de entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm text-gray-700">Tipo</p>
                    <p className="text-gray-900">
                      {deliveryNames[order.deliveryMethod as keyof typeof deliveryNames]}
                    </p>
                  </div>

                  {order.deliveryMethod === 'PICKUP_POINT' && (
                    <div>
                      <p className="font-medium text-sm text-gray-700 mb-1">
                        Punto de recogida
                      </p>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="font-medium">{order.pickupLocation}</p>
                        <p className="text-sm text-gray-600">{order.pickupAddress}</p>
                        <p className="text-sm text-amber-700 mt-1">
                          {order.pickupSchedule}
                        </p>
                      </div>
                    </div>
                  )}

                  {(order.deliveryMethod === 'LOCAL_DELIVERY' ||
                    order.deliveryMethod === 'NATIONAL_COURIER') && (
                    <div>
                      <p className="font-medium text-sm text-gray-700 mb-1">
                        Dirección de envío
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p>{order.shippingAddress}</p>
                        <p>
                          {order.shippingCity}, {order.shippingPostal}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {order.customerNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notas del pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{order.customerNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span>
                      {order.shippingCost === 0
                        ? 'Gratis'
                        : formatCurrency(order.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-amber-700">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado del pago</span>
                    <Badge
                      variant={
                        order.paymentStatus === 'PAID' ? 'success' : 'secondary'
                      }
                    >
                      {order.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado del pedido</span>
                    <Badge variant="default">{order.status}</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Volver a la tienda
                    </Button>
                  </Link>
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-xs text-amber-800">
                    <strong>📞 ¿Necesitas ayuda?</strong>
                    <br />
                    Contáctanos en contacto@tiempobakery.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
