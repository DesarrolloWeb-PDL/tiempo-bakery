import { getSiteContent } from '@/lib/site-content'

export const metadata = {
  title: 'Contacto | Tiempo Bakery',
}

export default async function ContactoPage() {
  const siteContent = await getSiteContent()

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-brand-gold">{siteContent.contactTitle}</h1>
      <p className="mt-4 text-brand-gold/85">{siteContent.contactIntro}</p>
      <div className="mt-6 space-y-2 text-brand-gold/85">
        <p>Email: {siteContent.contactEmail}</p>
        <p>Tel: {siteContent.contactPhone}</p>
        <p>WhatsApp: {siteContent.contactWhatsapp}</p>
        <p>{siteContent.contactAddress}</p>
      </div>
      <div className="mt-8 space-y-4 rounded-xl border border-brand-gold/20 bg-brand-bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-gold">Recogida</h2>
          <p className="mt-1 text-sm text-brand-gold/85">{siteContent.deliveryPickupText}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-gold">Reparto local</h2>
          <p className="mt-1 text-sm text-brand-gold/85">{siteContent.deliveryLocalText}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-gold">Mensajería urgente</h2>
          <p className="mt-1 text-sm text-brand-gold/85">{siteContent.deliveryCourierText}</p>
        </div>
      </div>
    </main>
  )
}
