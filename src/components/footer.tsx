'use client'

import { useAppTheme } from '@/hooks/useAppTheme'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { normalizePublicAssetUrl } from '@/lib/url-normalizer'
import type { SiteContent } from '@/lib/site-content.shared'

interface FooterProps {
  siteContent: SiteContent
}

export default function Footer({ siteContent }: FooterProps) {
  const pathname = usePathname()
  const { theme } = useAppTheme()
  const logoSrc = normalizePublicAssetUrl(theme.logoUrl) || '/img/espiga.png'
  const logoIsExternal = /^https?:\/\//i.test(logoSrc)

  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <footer 
      className="border-t bg-gray-50"
      style={{ borderColor: theme.primaryColor + '30' }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info */}
          <div>
            <h3 
              className="font-semibold mb-3"
              style={{ color: theme.primaryColor }}
            >
              {theme.logoUrl && (
                <Image
                  src={logoSrc}
                  alt={theme.appTitle}
                  className="h-6 w-6 inline-block mr-2 object-contain"
                  width={24}
                  height={24}
                  unoptimized={logoIsExternal}
                />
              )}
              {theme.appTitle}
            </h3>
            <p className="text-sm text-gray-600">
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
            <p className="text-sm text-gray-600">
              {siteContent.footerScheduleText}
              <br />
              <span className="text-xs text-gray-500">
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
            <p className="text-sm text-gray-600">
              Email: {siteContent.contactEmail}
              <br />
              Tel: {siteContent.contactPhone}
              <br />
              {siteContent.contactAddress}
            </p>
          </div>
        </div>

        <div 
          className="mt-8 pt-6 border-t"
          style={{ borderColor: theme.primaryColor + '30' }}
        >
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {theme.appTitle}. {siteContent.footerLegalNote}
          </p>
        </div>
      </div>
    </footer>
  )
}
