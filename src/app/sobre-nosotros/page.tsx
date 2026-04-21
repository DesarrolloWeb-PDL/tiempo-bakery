import { getSiteContent } from '@/lib/site-content'

export const metadata = {
  title: 'Sobre Nosotros | Tiempo Bakery',
}

export default async function SobreNosotrosPage() {
  const siteContent = await getSiteContent()

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">{siteContent.aboutTitle}</h1>
      <div className="mt-4 space-y-4 text-gray-700">
        <p>{siteContent.aboutBody}</p>
        <p>{siteContent.aboutSecondaryBody}</p>
      </div>
    </main>
  )
}
