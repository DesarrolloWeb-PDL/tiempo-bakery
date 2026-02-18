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
import { DeliveryMethod } from '@/types/checkout';
import type { CheckoutFormData } from '@/types/checkout';

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
  const clearCart = useCartStore((state) => state.clearCart);

  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pickupPoints, setPickupPoints] = React.useState<PickupPoint[]>([]);

  // Estado del formulario
  const [formData, setFormData] = React.useState<Partial<CheckoutFormData>>({
    email: '',
    name: '',
    phone: '',
    method: DeliveryMethod.PICKUP_POINT,
    customerNotes: '',
  });

  // Cargar puntos de recogida
  React.useEffect(() => {
    fetch('/api/puntos-recogida')
      .then((res) => res.json())
      .then((data) => setPickupPoints(data.puntos || []))
      .catch((err) => console.error('Error loading pickup points:', err));
  }, []);

  // Redirigir si el carrito está vacío
  React.useEffect(() => {
    if (items.length === 0) {
      router.push('/');
    }
  }, [items, router]);

  const handleCustomerUpdate = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleDeliveryUpdate = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNotesChange = (notes: string) => {
    setFormData((prev) => ({ ...prev, customerNotes: notes }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Preparar datos del pedido
      const orderData = {
        customerEmail: formData.email,
        customerName: formData.name,
        customerPhone: formData.phone,
        deliveryMethod: formData.method,
        pickupLocationId: formData.pickupLocationId,
        shippingAddress: formData.address,
        shippingCity: formData.city,
        shippingPostal: formData.postalCode,
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
        throw new Error(result.error || 'Error al procesar el pedido');
      }

      // Limpiar carrito
      clearCart();

      // Redirigir a Stripe Checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        // Si no hay URL de Stripe, ir a confirmación directamente
        router.push(`/pedido/${result.orderId}/confirmacion`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Error al procesar el pedido');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null; // El useEffect redirigirá
  }

  const steps = [
    { number: 1, title: 'Contacto', complete: currentStep > 1 },
    { number: 2, title: 'Entrega', complete: currentStep > 2 },
    { number: 3, title: 'Revisar', complete: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-amber-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a la tienda
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        step.complete || currentStep === step.number
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-gray-300 bg-white text-gray-400'
                      }`}
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
                          ? 'text-amber-700'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        step.complete ? 'bg-amber-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            {currentStep === 1 && (
              <CustomerInfoStep
                data={{
                  email: formData.email || '',
                  name: formData.name || '',
                  phone: formData.phone || '',
                }}
                onUpdate={handleCustomerUpdate}
                onNext={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 2 && (
              <DeliveryStep
                pickupPoints={pickupPoints}
                selectedMethod={formData.method || DeliveryMethod.PICKUP_POINT}
                pickupLocationId={formData.pickupLocationId}
                address={formData.address}
                city={formData.city}
                postalCode={formData.postalCode}
                onUpdate={handleDeliveryUpdate}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && (
              <ReviewStep
                items={items}
                customerData={{
                  email: formData.email || '',
                  name: formData.name || '',
                  phone: formData.phone || '',
                }}
                deliveryData={{
                  method: formData.method || DeliveryMethod.PICKUP_POINT,
                  pickupLocationId: formData.pickupLocationId,
                  address: formData.address,
                  city: formData.city,
                  postalCode: formData.postalCode,
                }}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="font-semibold text-gray-900 mb-4">
                Resumen del pedido
              </h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-gray-500">
                        {item.quantity} x {item.price.toFixed(2)}€
                        {item.sliced && ' • Rebanado'}
                      </p>
                    </div>
                    <span className="font-medium">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {items
                      .reduce((sum, item) => sum + item.price * item.quantity, 0)
                      .toFixed(2)}
                    €
                  </span>
                </div>
                {currentStep >= 2 && formData.method && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-medium">
                      {formData.method === DeliveryMethod.PICKUP_POINT
                        ? 'Gratis'
                        : formData.method === DeliveryMethod.LOCAL_DELIVERY
                        ? '3.50€'
                        : '5.95€'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span className="text-amber-700">
                    {(
                      items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
                      (currentStep >= 2 && formData.method
                        ? formData.method === DeliveryMethod.PICKUP_POINT
                          ? 0
                          : formData.method === DeliveryMethod.LOCAL_DELIVERY
                          ? 3.5
                          : 5.95
                        : 0)
                    ).toFixed(2)}
                    €
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Nota:</strong> Serás redirigido a Stripe para completar el pago
                  de forma segura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
