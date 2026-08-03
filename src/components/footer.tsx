'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Instagram, MessageCircle } from 'lucide-react'
import { normalizePublicAssetUrl } from '@/lib/url-normalizer'
import type { SiteContent } from '@/lib/site-content.shared'

interface FooterProps {
  siteContent: SiteContent
}

export default function Footer({ siteContent }: FooterProps) {
  const [year, setYear] = useState('')
  const pathname = usePathname()
  const theme = useTheme()
  const logoSrc = normalizePublicAssetUrl(theme.logoUrl) || '/img/espiga.png'
  const logoIsExternal = /^https?:\/\//i.test(logoSrc)

  useEffect(() => {
    setYear(String(new Date().getFullYear()))
  }, [])

  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <footer 
      className="border-t relative z-10"
      style={{ borderColor: theme.primaryColor + '30' }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info */}
          <div>
            <h3 
              className="font-semibold mb-3 truncate"
              style={{ color: theme.primaryColor, fontSize: theme.fontSizeTitle }}
            >
              {theme.logoUrl && (
                <Image
                  src={logoSrc}
                  alt={theme.appTitle}
                  className="inline-block mr-2 object-contain"
                  style={{ width: 'var(--brand-logo-size)', height: 'var(--brand-logo-size)' }}
                  width={Number(theme.logoSize) || 36}
                  height={Number(theme.logoSize) || 36}
                  unoptimized={logoIsExternal}
                />
              )}
              {theme.appTitle}
            </h3>
            <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
              {siteContent.footerDescription}
            </p>
          </div>

          {/* Horarios */}
          <div>
            <h3 
              className="font-semibold mb-3"
              style={{ color: theme.primaryColor }}
            >
              {siteContent.footerScheduleTitle}
            </h3>
            <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
              {siteContent.footerScheduleText}
              <br />
              <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                {siteContent.footerDeliveryText}
              </span>
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h3 
              className="font-semibold mb-3"
              style={{ color: theme.primaryColor }}
            >
              {siteContent.footerContactTitle}
            </h3>
            <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
              Email: {siteContent.contactEmail}
              <br />
              Tel: {siteContent.contactPhone}
              <br />
              {siteContent.contactAddress}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          {siteContent.contactInstagram && (
            <a
              href={siteContent.contactInstagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-brand-gold transition-colors"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              <Instagram className="w-5 h-5" />
            </a>
          )}
          {siteContent.contactWhatsapp && (
            <a
              href={`https://wa.me/${siteContent.contactWhatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hover:text-[#25D366] transition-colors"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          )}
        </div>

        <div 
          className="mt-6 pt-6 border-t"
          style={{ borderColor: theme.primaryColor + '30' }}
        >
          <p className="text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>
            © {year || '2026'} {theme.appTitle}. {siteContent.footerLegalNote}
          </p>
        </div>
      </div>
    </footer>
  )
}
