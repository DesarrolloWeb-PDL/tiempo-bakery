'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon'
import type { SiteContent } from '@/lib/site-content.shared'

interface WhatsAppButtonProps {
  siteContent: SiteContent
}

function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

export default function WhatsAppButton({ siteContent }: WhatsAppButtonProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || pathname.startsWith('/admin')) return null

  const phone = cleanPhone(siteContent.contactWhatsapp)
  const message = encodeURIComponent('Hola, vengo de Tiempo Bakery...')
  const url = `https://wa.me/${phone}?text=${message}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110"
      style={{ backgroundColor: '#25D366' }}
    >
      <WhatsAppIcon className="w-7 h-7 text-white" />
    </a>
  )
}
