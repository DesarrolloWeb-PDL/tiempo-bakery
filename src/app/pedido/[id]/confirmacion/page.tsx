'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, MapPin, Truck, Package, Printer, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { normalizePublicAssetUrl } from '@/lib/url-normalizer';
import { formatCurrency } from '@/lib/format';

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
  paymentMethod: string;
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

interface BankTransferSettings {
  enabled: boolean;
  bankName: string;
  accountHolder: string;
  alias: string;
  cbu: string;
  cuit: string;
  notes: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const sessionId = searchParams.get('session_id');
  const mpStatus = searchParams.get('status');
  const mpProvider = searchParams.get('provider');

  const [order, setOrder] = React.useState<Order | null>(null);
  const [bankTransfer, setBankTransfer] = React.useState<BankTransferSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [origin, setOrigin] = React.useState('');

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  React.useEffect(() => {
    if (!orderId) return;

    const email = localStorage.getItem('tbk_checkout_email') || '';
    const emailParam = email ? `?email=${encodeURIComponent(email)}` : '';

    Promise.all([
      fetch(`/api/pedidos/${orderId}${emailParam}`).then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar el pedido');
        return res.json();
      }),
      fetch('/api/payment-methods').then((res) => {
        if (!res.ok) throw new Error('No se pudieron cargar los medios de pago');
        return res.json();
      }),
    ])
      .then(([orderData, paymentData]) => {
        setOrder(orderData);
        setBankTransfer(paymentData.bankTransfer ?? null);
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
          <Loader2 className="h-12 w-12 animate-spin text-brand-gold mx-auto mb-4" />
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
  const isBankTransfer = order.paymentMethod === 'bank_transfer';

  const handleSendWhatsApp = () => {
    const deliveryLabel = deliveryNames[order.deliveryMethod as keyof typeof deliveryNames] || order.deliveryMethod;
    const itemsText = order.items
      .map((item) => `- ${item.productName} x${item.quantity}${item.sliced ? ' (Reb.)' : ''} = ${formatCurrency(item.subtotal)}`)
      .join('\n');
    const date = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(order.createdAt));
    const message = [
      '🧾 Comprobante Tiempo Bakery',
      '',
      `Pedido: #${order.orderNumber}`,
      `Fecha: ${date}`,
      `Cliente: ${order.customerName}`,
      '',
      'Productos:',
      itemsText,
      '',
      `Total: ${formatCurrency(order.total)}`,
      '',
      `📍 Entrega: ${deliveryLabel}`,
    ].join('\n');
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-ticket, .print-ticket * { visibility: visible; }
          .print-ticket { position: absolute; left: 0; top: 0; margin: 0 !important; max-width: 100% !important; border: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header according to payment status */}
        {mpProvider === 'mercadopago' && mpStatus === 'failure' ? (
          <div className="text-center mb-8 no-print">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <AlertCircle className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pago pendiente
            </h1>
            <p className="text-lg text-gray-600">
              El pago con Mercado Pago no se completó o fue cancelado.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Pedido: <strong>{order.orderNumber}</strong> — Podés volver a intentar el pago desde la sección de pedidos.
            </p>
          </div>
        ) : (
          <div className="text-center mb-8 no-print">
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
        )}

        {/* Print Button */}
        <div className="flex justify-center mb-6 gap-4 no-print">
          <Button onClick={() => window.print()} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir comprobante
          </Button>
          <Button onClick={handleSendWhatsApp} className="flex items-center gap-2" style={{ backgroundColor: '#25D366', color: 'white' }}>
            <MessageCircle className="h-4 w-4" />
            Enviar por WhatsApp
          </Button>
        </div>

        {/* Printable Ticket */}
        <div className="print-ticket bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 max-w-sm mx-auto">
          <div className="text-center border-b-2 border-dashed pb-3 mb-3">
            <p className="text-lg font-bold">Tiempo Bakery</p>
            <p className="text-xs text-gray-600">Micropanadería artesanal</p>
          </div>
          <div className="text-center mb-3">
            <p className="text-[10px] text-gray-500">{order.orderNumber}</p>
            <p className="text-2xl font-bold tracking-widest">{order.orderNumber}</p>
            <div className="flex justify-center mt-2">
              <img
                src={`https://quickchart.io/qr?text=${encodeURIComponent(`${origin}/pedido/${order.id}/confirmacion`)}&size=150&margin=2`}
                alt="QR del pedido"
                className="w-24 h-24"
              />
            </div>
          </div>
          <div className="border-t border-dashed pt-3 mb-3 space-y-1">
            <p className="text-xs"><span className="font-semibold">Cliente:</span> {order.customerName}</p>
            <p className="text-xs"><span className="font-semibold">Fecha:</span> {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(order.createdAt))}</p>
          </div>
          <div className="border-t border-dashed pt-3 mb-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-xs mb-1">
                <span>{item.productName} x{item.quantity}{item.sliced ? ' (Reb.)' : ''}</span>
                <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs border-t pt-1 mt-1">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{formatCurrency(order.total)}</span>
            </div>
          </div>
          <div className="border-t border-dashed pt-3 text-center">
            {order.deliveryMethod === 'PICKUP_POINT' && (
              <>
                <p className="font-semibold text-sm">{order.pickupLocation}</p>
                <p className="text-xs text-gray-600">{order.pickupAddress}</p>
                <p className="text-xs text-gray-600">{order.pickupSchedule}</p>
              </>
            )}
            {(order.deliveryMethod === 'LOCAL_DELIVERY' || order.deliveryMethod === 'NATIONAL_COURIER') && (
              <p className="text-xs">Envío a: {order.shippingAddress}, {order.shippingCity}</p>
            )}
          </div>
          <div className="border-t-2 border-dashed mt-3 pt-2 text-center">
            <p className="text-[10px] text-gray-400">Presentá este comprobante al retirar tu pedido</p>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <Card className="mb-6 bg-blue-50 border-blue-200 no-print">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              📧 Si el email está bien ingresado, recibirás la confirmación en{' '}
              <strong>{order.customerEmail}</strong> con los detalles de tu pedido.
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
                          src={normalizePublicAssetUrl(item.product.imageUrl) || '/img/espiga.png'}
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
                      <div className="bg-brand-gold/5 rounded-lg p-3">
                        <p className="font-medium">{order.pickupLocation}</p>
                        <p className="text-sm text-gray-600">{order.pickupAddress}</p>
                        <p className="text-sm text-brand-gold-dark mt-1">
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
                    <span className="text-brand-gold-dark">{formatCurrency(order.total)}</span>
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

                {isBankTransfer && bankTransfer?.enabled && (
                  <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4 space-y-2">
                    <p className="text-sm font-semibold text-brand-gold-dark">Datos para transferir</p>
                    {bankTransfer.bankName && (
                      <p className="text-sm text-brand-gold-dark"><span className="font-medium">Banco:</span> {bankTransfer.bankName}</p>
                    )}
                    {bankTransfer.accountHolder && (
                      <p className="text-sm text-brand-gold-dark"><span className="font-medium">Titular:</span> {bankTransfer.accountHolder}</p>
                    )}
                    {bankTransfer.alias && (
                      <p className="text-sm text-brand-gold-dark"><span className="font-medium">Alias:</span> {bankTransfer.alias}</p>
                    )}
                    {bankTransfer.cbu && (
                      <p className="text-sm text-brand-gold-dark break-all"><span className="font-medium">CBU:</span> {bankTransfer.cbu}</p>
                    )}
                    {bankTransfer.cuit && (
                      <p className="text-sm text-brand-gold-dark"><span className="font-medium">CUIT:</span> {bankTransfer.cuit}</p>
                    )}
                    {bankTransfer.notes && (
                      <p className="text-sm text-brand-gold-dark whitespace-pre-line">{bankTransfer.notes}</p>
                    )}
                    <p className="text-xs text-brand-gold-dark">Subí o enviá el comprobante para agilizar la confirmación.</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Volver a la tienda
                    </Button>
                  </Link>
                </div>

                <div className="bg-brand-gold/5 rounded-lg p-4">
                  <p className="text-xs text-brand-gold-dark">
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
    </>
  );
}
