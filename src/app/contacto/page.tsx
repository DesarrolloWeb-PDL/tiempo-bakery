import { getSiteContent } from '@/lib/site-content'

export const metadata = {
  title: 'Contacto | Tiempo Bakery',
}

export default async function ContactoPage() {
  const siteContent = await getSiteContent()

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">{siteContent.contactTitle}</h1>
      <p className="mt-4 text-gray-700">{siteContent.contactIntro}</p>
      <div className="mt-6 space-y-2 text-gray-700">
        <p>Email: {siteContent.contactEmail}</p>
        <p>Tel: {siteContent.contactPhone}</p>
        <p>WhatsApp: {siteContent.contactWhatsapp}</p>
        <p>{siteContent.contactAddress}</p>
      </div>
      <div className="mt-8 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recogida</h2>
          <p className="mt-1 text-sm text-gray-700">{siteContent.deliveryPickupText}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reparto local</h2>
          <p className="mt-1 text-sm text-gray-700">{siteContent.deliveryLocalText}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mensajería urgente</h2>
          <p className="mt-1 text-sm text-gray-700">{siteContent.deliveryCourierText}</p>
        </div>
      </div>
    </main>
  )
}
