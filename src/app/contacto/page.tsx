import { getSiteContent } from '@/lib/site-content'
import { getShippingCostsRuntime } from '@/lib/shipping-costs'
import { TranslatedContact } from '@/components/translated-contact'

export const metadata = {
  title: 'Contacto | Tiempo Masa Madre',
}

export default async function ContactoPage() {
  const [siteContent, shippingCosts] = await Promise.all([
    getSiteContent(),
    getShippingCostsRuntime(),
  ])

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <TranslatedContact siteContent={siteContent} nationalCourierEnabled={shippingCosts.nationalCourierEnabled} />
    </main>
  )
}
