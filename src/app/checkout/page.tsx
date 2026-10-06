'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { CustomerInfoStep } from '@/components/checkout/customer-info-step';
import { DeliveryStep } from '@/components/checkout/delivery-step';
import { ReviewStep } from '@/components/checkout/review-step';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/toaster';
import { toast } from '@/components/ui/use-toast';
import { DeliveryMethod, DEFAULT_SHIPPING_COSTS, PaymentProvider, type PaymentMethodOption, type ShippingCosts } from '@/types/checkout';
import type { CheckoutFormData, CheckoutCustomerData } from '@/types/checkout';
import type { DeliveryZone, AvailableSlot } from '@/types/delivery';
import { formatCurrency } from '@/lib/format';
import { useLanguage } from '@/components/language-provider';

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  schedule: string;
  instructions?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const { t } = useLanguage();

  const [currentStep, setCurrentStep] = React.useState(1);
  const [mounted, setMounted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pickupPoints, setPickupPoints] = React.useState<PickupPoint[]>([]);
  const [shippingCosts, setShippingCosts] = React.useState<ShippingCosts>(DEFAULT_SHIPPING_COSTS);
  const [zones, setZones] = React.useState<DeliveryZone[]>([]);
  const [availableDays, setAvailableDays] = React.useState<Array<{ date: Date; slot: AvailableSlot }>>([]);
  const [paymentOptions, setPaymentOptions] = React.useState<PaymentMethodOption[]>([]);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = React.useState<PaymentProvider>(PaymentProvider.STRIPE);

  const stepsRef = React.useRef<HTMLDivElement>(null);
  const isFirstStepRender = React.useRef(true);

  // Smooth scroll to progress steps when the step changes (skip mount)
  React.useEffect(() => {
    if (isFirstStepRender.current) {
      isFirstStepRender.current = false;
      return;
    }
    stepsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentStep]);

  // Estado del formulario
  const [formData, setFormData] = React.useState<Partial<CheckoutFormData>>({
    customerEmail: '',
    customerName: '',
    customerPhone: '',
    deliveryMethod: DeliveryMethod.PICKUP_POINT,
    customerNotes: '',
  });

  // Evitar hydration mismatch por Zustand persist
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar puntos de recogida
  React.useEffect(() => {
    fetch('/api/puntos-recogida')
      .then((res) => res.json())
      .then((data) => setPickupPoints(data.puntos || []))
      .catch((err) => console.error('Error loading pickup points:', err));

    fetch('/api/shipping-costs')
      .then((res) => {
        if (!res.ok) throw new Error(t.checkoutErrorShipping)
        return res.json()
      })
      .then((data) => {
        setShippingCosts({
          PICKUP_POINT: Number(data.pickupPoint ?? 0),
          LOCAL_DELIVERY: Number(data.localDelivery ?? DEFAULT_SHIPPING_COSTS.LOCAL_DELIVERY),
          NATIONAL_COURIER: Number(data.nationalCourier ?? DEFAULT_SHIPPING_COSTS.NATIONAL_COURIER),
          nationalCourierEnabled: data.nationalCourierEnabled ?? false,
        })
      })
      .catch((err) => console.error('Error loading shipping costs:', err));

    fetch('/api/payment-methods')
      .then((res) => {
        if (!res.ok) throw new Error(t.checkoutErrorPayment)
        return res.json()
      })
      .then((data) => {
        setPaymentOptions(data.options || [])
        setSelectedPaymentProvider(data.defaultProvider || PaymentProvider.STRIPE)
      })
      .catch((err) => console.error('Error loading payment methods:', err));

    fetch('/api/delivery-options?horizon=14')
      .then((res) => {
        if (!res.ok) throw new Error(t.checkoutErrorShipping)
        return res.json()
      })
      .then((data) => {
        setZones(data.zones || [])
        setAvailableDays((data.days || []).map((d: { date: string; slot: AvailableSlot }) => ({
          date: new Date(d.date),
          slot: d.slot,
        })))
      })
      .catch((err) => console.error('Error loading delivery options:', err));
  }, []);

  // Redirigir si el carrito está vacío
  React.useEffect(() => {
    if (items.length === 0) {
      router.push('/');
    }
  }, [items, router]);

  const handleCustomerUpdate = (data: CheckoutCustomerData) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleDeliveryUpdate = (data: Partial<CheckoutFormData>) => {
    setFormData((prev) => {
      const next: Partial<CheckoutFormData> = { ...prev, ...data };
      if (data.deliveryDate !== undefined) {
        next.deliveryDate = new Date(data.deliveryDate);
      }
      return next;
    });
  };

  const handleNotesChange = (notes: string) => {
    setFormData((prev) => ({ ...prev, customerNotes: notes }));
  };

  const [processingMessage, setProcessingMessage] = React.useState('');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Yield to browser so the overlay actually renders before the API call
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      setProcessingMessage(t.checkoutProcessing);

      const orderData = {
        customerEmail: formData.customerEmail,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deliveryMethod: formData.deliveryMethod,
        paymentProvider: selectedPaymentProvider,
        pickupLocationId: formData.pickupLocationId,
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        shippingPostal: formData.shippingPostal,
        zoneId: formData.zoneId,
        scheduleId: formData.scheduleId,
        deliveryDate: formData.deliveryDate,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          sliced: item.sliced,
        })),
        customerNotes: formData.customerNotes,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t.checkoutErrorProcessing);
      }

      if (formData.customerEmail) {
        localStorage.setItem('tbk_checkout_email', formData.customerEmail);
      }

      const redirectUrl = result.checkoutUrl || `/pedido/${result.orderId}/confirmacion`;

      // Keep the opaque overlay up until the browser navigates.
      // Do NOT clear the cart here — only confirmation clears it once payment
      // is done (or order accepted for transfer/cash). If MP payment is
      // abandoned, the buyer still has their cart.
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : t.checkoutErrorProcessing,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };


  if (!mounted) {
    return <div className="min-h-screen" />;
  }

  if (items.length === 0) {
    return null;
  }

  const steps = [
    { number: 1, title: t.checkoutStepContact, complete: currentStep > 1 },
    { number: 2, title: t.checkoutStepDelivery, complete: currentStep > 2 },
    { number: 3, title: t.checkoutStepReview, complete: false },
  ];

  const shippingCost = currentStep >= 2 && formData.deliveryMethod
    ? shippingCosts[formData.deliveryMethod]
    : 0;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingCost;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm hover:text-brand-gold-dark mb-4"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.checkoutBack}
          </Link>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--brand-text-primary)' }}>{t.checkoutTitle}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <div ref={stepsRef} className="flex items-center justify-between scroll-mt-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        step.complete || currentStep === step.number
                          ? 'border-brand-gold bg-brand-gold text-white'
                          : ''
                      }`}
                      style={!(step.complete || currentStep === step.number) ? { borderColor: 'var(--brand-border)', backgroundColor: 'var(--brand-bg-card)', color: 'var(--brand-text-muted)' } : undefined}
                    >
                      {step.complete ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{step.number}</span>
                      )}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium ${
                        step.complete || currentStep === step.number
                          ? 'text-brand-gold-dark'
                          : ''
                      }`}
                      style={!(step.complete || currentStep === step.number) ? { color: 'var(--brand-text-muted)' } : undefined}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        step.complete ? 'bg-brand-gold' : ''
                      }`}
                      style={!step.complete ? { backgroundColor: 'var(--brand-border)' } : undefined}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            {currentStep === 1 && (
              <CustomerInfoStep
                data={{
                  customerEmail: formData.customerEmail || '',
                  customerName: formData.customerName || '',
                  customerPhone: formData.customerPhone || '',
                }}
                onUpdate={handleCustomerUpdate}
                onNext={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 2 && (
              <DeliveryStep
                pickupPoints={pickupPoints}
                selectedMethod={formData.deliveryMethod || DeliveryMethod.PICKUP_POINT}
                shippingCosts={shippingCosts}
                zones={zones}
                availableDays={availableDays}
                pickupLocationId={formData.pickupLocationId}
                address={formData.shippingAddress}
                city={formData.shippingCity}
                postalCode={formData.shippingPostal}
                zoneId={formData.zoneId}
                scheduleId={formData.scheduleId}
                deliveryDate={formData.deliveryDate}
                onUpdate={handleDeliveryUpdate}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && (
              <ReviewStep
                items={items}
                shippingCosts={shippingCosts}
                customerData={{
                  email: formData.customerEmail || '',
                  name: formData.customerName || '',
                  phone: formData.customerPhone || '',
                }}
                deliveryData={{
                  method: formData.deliveryMethod || DeliveryMethod.PICKUP_POINT,
                  pickupLocationId: formData.pickupLocationId,
                  address: formData.shippingAddress,
                  city: formData.shippingCity,
                  postalCode: formData.shippingPostal,
                }}
                paymentOptions={paymentOptions}
                selectedPaymentProvider={selectedPaymentProvider}
                onPaymentProviderChange={setSelectedPaymentProvider}
                pickupPoints={pickupPoints}
                customerNotes={(formData.customerNotes as string | undefined) || ''}
                onNotesChange={handleNotesChange}
                onBack={() => setCurrentStep(2)}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </div>

          {/* Resumen - 1/3 */}
          <div className="lg:col-span-1">
            <div className="rounded-lg shadow-sm p-6 sticky top-8 backdrop-blur-xl" style={{ backgroundColor: 'rgba(44, 44, 44, 0.85)', borderColor: 'var(--brand-border)' }}>
              <h2 className="font-semibold mb-4" style={{ color: 'var(--brand-text-primary)' }}>
                {t.checkoutResumen}
              </h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p style={{ color: 'var(--brand-text-muted)' }}>
                        {item.quantity} x {formatCurrency(item.price)}
                        {item.sliced && ` • ${t.cartSliced}`}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2" style={{ borderColor: 'var(--brand-border)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--brand-text-muted)' }}>{t.checkoutSubtotal}</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {currentStep >= 2 && formData.deliveryMethod && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--brand-text-muted)' }}>{t.checkoutShipping}</span>
                    <span className="font-medium">
                      {shippingCost === 0 ? t.checkoutFree : formatCurrency(shippingCost)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2" style={{ borderColor: 'var(--brand-border)' }}>
                  <span>{t.checkoutTotal}</span>
                  <span className="text-brand-gold-dark">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-brand-gold/5 rounded-lg">
                <p className="text-xs text-brand-gold-dark">
                  <strong>{t.checkoutNote}</strong>{' '}
                  {selectedPaymentProvider === PaymentProvider.BANK_TRANSFER
                    ? t.checkoutNoteBank
                    : selectedPaymentProvider === PaymentProvider.EFECTIVO
                      ? 'Pagás en efectivo cuando retirás el pedido. Te lo vamos a estar esperando en el local.'
                      : `${t.checkoutNoteRedirect} ${selectedPaymentProvider === PaymentProvider.MERCADO_PAGO ? 'Mercado Pago' : 'Stripe'} para completar el pago de forma segura.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Overlay — opaque so no checkout flash before MP opens */}
      {isSubmitting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: '#111111' }}
        >
          <div
            className="relative rounded-2xl shadow-2xl p-8 mx-4 text-center max-w-sm w-full backdrop-blur-xl"
            style={{ backgroundColor: 'rgba(44, 44, 44, 0.9)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hourglass */}
            <div className="relative mx-auto mb-6 w-20 h-20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-20 h-20 text-brand-gold animate-pulse"
              >
                <path
                  d="M6 2h12v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V2z"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <path
                  d="M10 10.5v.5a2 2 0 0 0 4 0v-.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                />
                <path
                  d="M6 22h12v-4a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4z"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <path
                  d="M6 2v4a4 4 0 0 0 4 4h1m1-4v-4"
                  stroke="currentColor"
                  strokeLinecap="round"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="0 12 12;180 12 12"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
            </div>

            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--brand-text-primary)' }}>
              {t.checkoutProcessing}
            </h3>
            <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
              {processingMessage}
            </p>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}
