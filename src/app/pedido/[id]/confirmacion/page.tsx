'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, MapPin, Truck, Package, Printer, MessageCircle, Clock, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { normalizePublicAssetUrl } from '@/lib/url-normalizer';
import { formatCurrency } from '@/lib/format';
import { useLanguage } from '@/components/language-provider';

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

interface CopyFieldProps {
  label: string;
  value: string;
  copiedField: string | null;
  onCopy: (label: string, value: string) => void;
  gold?: boolean;
  mono?: boolean;
}

function CopyField({ label, value, copiedField, onCopy, gold, mono }: CopyFieldProps) {
  const isCopied = copiedField === label;
  return (
    <div className="rounded-lg p-3 group" style={{ backgroundColor: 'var(--brand-muted-bg)' }}>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--brand-text-muted)' }}>{label}</p>
      <div className="flex items-center justify-between gap-2">
        <p className={`font-semibold truncate ${gold ? 'text-brand-gold-dark' : ''} ${mono ? 'font-mono break-all' : ''}`} style={gold ? undefined : { color: 'var(--brand-text-primary)' }}>
          {value}
        </p>
        <button
          type="button"
          onClick={() => onCopy(label, value)}
          className="shrink-0 p-1 rounded transition-colors hover:bg-brand-gold/10"
          title={`Copiar ${label}`}
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" style={{ color: 'var(--brand-text-muted)' }} />
          )}
        </button>
      </div>
    </div>
  );
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
  const [whatsappNumber, setWhatsappNumber] = React.useState('');
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const { t } = useLanguage();

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
      fetch('/api/site-content').then((res) => {
        if (!res.ok) return null;
        return res.json();
      }).catch(() => null),
    ])
      .then(([orderData, paymentData, siteData]) => {
        setOrder(orderData);
        setBankTransfer(paymentData.bankTransfer ?? null);
        if (siteData?.contactWhatsapp) {
          setWhatsappNumber(siteData.contactWhatsapp.replace(/[^0-9]/g, ''));
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--brand-bg)' }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-gold mx-auto mb-4" />
          <p style={{ color: 'var(--brand-text-muted)' }}>{t.confirmLoading}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--brand-bg)' }}>
        <Card className="max-w-md backdrop-blur-xl" style={{ backgroundColor: 'rgba(44, 44, 44, 0.85)', borderColor: 'var(--brand-border)' }}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <CardTitle style={{ color: 'var(--brand-text-primary)' }}>Error</CardTitle>
            </div>
            <CardDescription style={{ color: 'var(--brand-text-muted)' }}>
              {error || t.confirmNotFound}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">{t.checkoutBack}</Button>
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
    PICKUP_POINT: t.deliveryMethodNamePickup,
    LOCAL_DELIVERY: t.deliveryMethodNameLocal,
    NATIONAL_COURIER: t.deliveryMethodNameCourier,
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
      '🧾 Comprobante Tiempo Masa Madre',
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
    const phone = whatsappNumber || '';
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const handleCopyField = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    }
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
    <div className="min-h-screen py-12" style={{ backgroundColor: 'var(--brand-bg)' }}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header according to payment status */}
        {mpProvider === 'mercadopago' && mpStatus === 'failure' ? (
          <div className="text-center mb-8 no-print">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-900/30 mb-4">
              <AlertCircle className="h-10 w-10 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--brand-text-primary)' }}>
              {t.confirmPaymentPending}
            </h1>
            <p className="text-lg" style={{ color: 'var(--brand-text-muted)' }}>
              {t.confirmPaymentPendingDesc}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--brand-text-muted)' }}>
              Pedido: <strong style={{ color: 'var(--brand-text-primary)' }}>{order.orderNumber}</strong> — {t.confirmPaymentRetry}
            </p>
          </div>
        ) : (
          <div className="text-center mb-8 no-print">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 mb-4">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--brand-text-primary)' }}>
              {t.confirmTitle}
            </h1>
            <p className="text-lg" style={{ color: 'var(--brand-text-muted)' }}>
              {t.confirmThanks}, {order.customerName}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--brand-text-muted)' }}>
              {t.confirmOrderNumber}: <strong style={{ color: 'var(--brand-text-primary)' }}>{order.orderNumber}</strong>
            </p>
          </div>
        )}

        {/* === BANK TRANSFER DATA — PRIMARY INFO === */}
        {isBankTransfer && bankTransfer?.enabled && (
          <Card className="mb-8 no-print backdrop-blur-xl" style={{ backgroundColor: 'rgba(44, 44, 44, 0.85)', borderColor: 'var(--brand-gold)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-gold-dark">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Datos para transferir
              </CardTitle>
              <CardDescription style={{ color: 'var(--brand-text-muted)' }}>
                Realizá la transferencia con estos datos y enviá el comprobante para agilizar la confirmación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bankTransfer.bankName && (
                  <CopyField label="Banco" value={bankTransfer.bankName} copiedField={copiedField} onCopy={handleCopyField} />
                )}
                {bankTransfer.accountHolder && (
                  <CopyField label="Titular" value={bankTransfer.accountHolder} copiedField={copiedField} onCopy={handleCopyField} />
                )}
                {bankTransfer.alias && (
                  <CopyField label="Alias" value={bankTransfer.alias} copiedField={copiedField} onCopy={handleCopyField} gold />
                )}
                {bankTransfer.cbu && (
                  <CopyField label="CBU" value={bankTransfer.cbu} copiedField={copiedField} onCopy={handleCopyField} gold mono />
                )}
                {bankTransfer.cuit && (
                  <CopyField label="CUIT" value={bankTransfer.cuit} copiedField={copiedField} onCopy={handleCopyField} mono />
                )}
              </div>
              {bankTransfer.notes && (
                <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: 'var(--brand-muted-bg)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--brand-text-muted)' }}>Instrucciones</p>
                  <p className="text-sm whitespace-pre-line" style={{ color: 'var(--brand-text-primary)' }}>{bankTransfer.notes}</p>
                </div>
              )}
              <div className="mt-4 flex items-start gap-2 rounded-lg p-3 border border-brand-gold/20 bg-brand-gold/5">
                <Clock className="h-4 w-4 text-brand-gold-dark shrink-0 mt-0.5" />
                <p className="text-sm text-brand-gold-dark">Subí o enviá el comprobante por WhatsApp para agilizar la confirmación de tu pedido.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Print & WhatsApp Buttons */}
        <div className="flex justify-center mb-6 gap-4 no-print">
          <Button onClick={() => window.print()} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            {t.confirmPrint}
          </Button>
          <Button onClick={handleSendWhatsApp} className="flex items-center gap-2" style={{ backgroundColor: '#25D366', color: 'white' }}>
            <MessageCircle className="h-4 w-4" />
            Enviar comprobante por WhatsApp
          </Button>
        </div>

        {/* Ticket + Order Status side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Printable Ticket — center */}
          <div className="lg:col-span-3 flex justify-center">
            <div className="print-ticket bg-white border-2 border-gray-300 rounded-lg p-6 w-full max-w-sm">
              <div className="text-center border-b-2 border-dashed pb-3 mb-3">
                <p className="text-lg font-bold text-gray-900">Tiempo Masa Madre</p>
                <p className="text-xs text-gray-600">Micropanadería artesanal</p>
              </div>
              <div className="text-center mb-3">
                <p className="text-[10px] text-gray-500">{order.orderNumber}</p>
                <p className="text-2xl font-bold tracking-widest text-gray-900">{order.orderNumber}</p>
                <div className="flex justify-center mt-2">
                  <img
                    src={`https://quickchart.io/qr?text=${encodeURIComponent(`${origin}/pedido/${order.id}/confirmacion`)}&size=150&margin=2`}
                    alt="QR del pedido"
                    className="w-24 h-24"
                  />
                </div>
              </div>
              <div className="border-t border-dashed pt-3 mb-3 space-y-1">
                <p className="text-xs text-gray-900"><span className="font-semibold">Cliente:</span> {order.customerName}</p>
                <p className="text-xs text-gray-900"><span className="font-semibold">Fecha:</span> {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(order.createdAt))}</p>
              </div>
              <div className="border-t border-dashed pt-3 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs mb-1 text-gray-900">
                    <span>{item.productName} x{item.quantity}{item.sliced ? ' (Reb.)' : ''}</span>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs border-t border-gray-300 pt-1 mt-1 text-gray-900">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">{formatCurrency(order.total)}</span>
                </div>
              </div>
              <div className="border-t border-dashed pt-3 text-center">
                {order.deliveryMethod === 'PICKUP_POINT' && (
                  <>
                    <p className="font-semibold text-sm text-gray-900">{order.pickupLocation}</p>
                    <p className="text-xs text-gray-600">{order.pickupAddress}</p>
                    <p className="text-xs text-gray-600">{order.pickupSchedule}</p>
                  </>
                )}
                {(order.deliveryMethod === 'LOCAL_DELIVERY' || order.deliveryMethod === 'NATIONAL_COURIER') && (
                  <p className="text-xs text-gray-900">Envío a: {order.shippingAddress}, {order.shippingCity}</p>
                )}
              </div>
              <div className="border-t-2 border-dashed mt-3 pt-2 text-center">
                <p className="text-[10px] text-gray-400">{t.confirmShowAtPickup}</p>
              </div>
            </div>
          </div>

          {/* Order Status — right side, next to ticket */}
          <div className="lg:col-span-2 no-print">
            <Card className="backdrop-blur-xl" style={{ backgroundColor: 'rgba(44, 44, 44, 0.85)', borderColor: 'var(--brand-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--brand-text-primary)' }}>Estado del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Pago</span>
                  <Badge
                    className={
                      order.paymentStatus === 'PAID'
                        ? 'bg-green-900/40 text-green-300 border-green-700/50'
                        : 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50'
                    }
                  >
                    {order.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}
                  </Badge>
                </div>

                {/* Order status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Estado</span>
                  <Badge className="bg-brand-gold/20 text-brand-gold-dark border-brand-gold/30">
                    {order.status === 'PENDING' ? 'Pendiente' : order.status === 'CONFIRMED' ? 'Confirmado' : order.status === 'DELIVERED' ? 'Entregado' : order.status}
                  </Badge>
                </div>

                {/* Delivery method */}
                <div className="pt-3 border-t" style={{ borderColor: 'var(--brand-border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--brand-text-muted)' }}>Entrega</p>
                  <div className="flex items-center gap-2">
                    {DeliveryIcon && <DeliveryIcon className="h-4 w-4" style={{ color: 'var(--brand-text-muted)' }} />}
                    <span className="text-sm font-medium" style={{ color: 'var(--brand-text-primary)' }}>
                      {deliveryNames[order.deliveryMethod as keyof typeof deliveryNames]}
                    </span>
                  </div>
                </div>

                {/* Pickup point details */}
                {order.deliveryMethod === 'PICKUP_POINT' && order.pickupLocation && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--brand-muted-bg)' }}>
                    <p className="font-medium text-sm" style={{ color: 'var(--brand-text-primary)' }}>{order.pickupLocation}</p>
                    <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{order.pickupAddress}</p>
                    <p className="text-xs text-brand-gold-dark mt-1">{order.pickupSchedule}</p>
                  </div>
                )}

                {/* Shipping address details */}
                {(order.deliveryMethod === 'LOCAL_DELIVERY' || order.deliveryMethod === 'NATIONAL_COURIER') && order.shippingAddress && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--brand-muted-bg)' }}>
                    <p className="text-sm" style={{ color: 'var(--brand-text-primary)' }}>{order.shippingAddress}</p>
                    <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{order.shippingCity}, {order.shippingPostal}</p>
                  </div>
                )}

                {/* Cost summary */}
                <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--brand-border)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--brand-text-muted)' }}>Subtotal</span>
                    <span style={{ color: 'var(--brand-text-primary)' }}>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--brand-text-muted)' }}>Envío</span>
                    <span style={{ color: 'var(--brand-text-primary)' }}>
                      {order.shippingCost === 0 ? 'Gratis' : formatCurrency(order.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2" style={{ borderColor: 'var(--brand-border)' }}>
                    <span style={{ color: 'var(--brand-text-primary)' }}>Total</span>
                    <span className="text-brand-gold-dark">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {/* Help */}
                <div className="pt-3 border-t" style={{ borderColor: 'var(--brand-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                    <strong>📞 {t.confirmNeedHelp}</strong>
                    <br />
                    contacto@tiempobakery.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <Card className="mb-6 no-print backdrop-blur-xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <CardContent className="p-4">
            <p className="text-sm text-blue-300">
              📧 {t.confirmEmailNotice}{' '}
              <strong className="text-blue-200">{order.customerEmail}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Products & Delivery Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Productos */}
            <Card className="backdrop-blur-xl" style={{ backgroundColor: 'rgba(44, 44, 44, 0.85)', borderColor: 'var(--brand-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--brand-text-primary)' }}>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                      style={{ borderColor: 'var(--brand-border)' }}
                    >
                      <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden" style={{ backgroundColor: 'var(--brand-muted-bg)' }}>
                        <Image
                          src={normalizePublicAssetUrl(item.product.imageUrl) || '/img/espiga.png'}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium" style={{ color: 'var(--brand-text-primary)' }}>{item.productName}</h3>
                        {item.product.weight && (
                          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
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
                        <p className="font-semibold" style={{ color: 'var(--brand-text-primary)' }}>{formatCurrency(item.subtotal)}</p>
                        <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
                          {formatCurrency(item.unitPrice)}/ud
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notas del pedido */}
            {order.customerNotes && (
            <Card style={{ backgroundColor: 'rgba(44, 44, 44, 0.85)' }} className="backdrop-blur-xl">
                <CardHeader>
                  <CardTitle style={{ color: 'var(--brand-text-primary)' }}>Notas del pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>{order.customerNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Empty spacer for layout balance on large screens */}
          <div className="hidden lg:block lg:col-span-1" />
        </div>

        {/* Back to home */}
        <div className="mt-8 text-center no-print">
          <Link href="/">
            <Button variant="outline" className="px-8">
              {t.checkoutBack}
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
