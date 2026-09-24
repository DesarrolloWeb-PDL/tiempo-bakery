'use client'

import { useLanguage } from '@/components/language-provider'
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon'
import type { SiteContent } from '@/lib/site-content.shared'

interface TranslatedContactProps {
  siteContent: SiteContent
}

export function TranslatedContact({ siteContent }: TranslatedContactProps) {
  const { t } = useLanguage()
  const whatsappPhone = siteContent.contactWhatsapp.replace(/[^0-9]/g, '')
  const whatsappMessage = encodeURIComponent(t.whatsappDefaultMessage)
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`

  return (
    <>
      <h1 className="text-3xl font-bold text-brand-gold">{t.contactTitle}</h1>
      <p className="mt-4 text-brand-gold/85">{t.contactIntro}</p>
      <div className="mt-6 space-y-2 text-brand-gold/85">
        <p>Email: {siteContent.contactEmail}</p>
        <p>Tel: {siteContent.contactPhone}</p>
        <p>WhatsApp: {siteContent.contactWhatsapp}</p>
        <p>{siteContent.contactAddress}</p>
      </div>
      <div className="mt-6">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-transform hover:scale-105"
          style={{ backgroundColor: '#25D366' }}
        >
          <WhatsAppIcon className="w-5 h-5 text-white" />
          {t.contactWhatsappBtn}
        </a>
      </div>
      <div className="mt-8 space-y-4 rounded-xl border border-brand-gold/20 bg-brand-bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-gold">{t.deliveryPickup}</h2>
          <p className="mt-1 text-sm text-brand-gold/85">{t.deliveryPickupText}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-gold">{t.deliveryLocal} ({siteContent.cityName})</h2>
          <p className="mt-1 text-sm text-brand-gold/85">{t.deliveryLocalText}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-gold">{t.deliveryCourier}</h2>
          <p className="mt-1 text-sm text-brand-gold/85">{t.deliveryCourierText}</p>
        </div>
      </div>
    </>
  )
}
