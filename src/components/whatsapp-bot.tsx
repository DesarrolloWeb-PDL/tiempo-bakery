'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon'
import { useLanguage } from '@/components/language-provider'
import type { SiteContent } from '@/lib/site-content.shared'

interface WhatsAppBotProps {
  siteContent: SiteContent
}

interface FAQItem {
  question: string
  answer: string
}

function getFaqItems(t: ReturnType<typeof import('@/components/language-provider')['useLanguage']>['t'], cityName: string): FAQItem[] {
  return [
    {
      question: `🍞 ${t.whatsappFaqSourdough}`,
      answer: t.whatsappFaqSourdoughAnswer,
    },
    {
      question: `📅 ${t.whatsappFaqDelivery}`,
      answer: t.whatsappFaqDeliveryAnswer,
    },
    {
      question: `🚚 ${t.whatsappFaqLocalDelivery}`,
      answer: t.whatsappFaqLocalDeliveryAnswer.replace(/en tu zona/g, `en ${cityName}`),
    },
    {
      question: `🌾 ${t.whatsappFaqGluten}`,
      answer: t.whatsappFaqGlutenAnswer,
    },
    {
      question: `🛒 ${t.whatsappFaqOrder}`,
      answer: t.whatsappFaqOrderAnswer,
    },
    {
      question: `📍 ${t.whatsappFaqPickup}`,
      answer: t.whatsappFaqPickupAnswer.replace(/en distintas zonas/g, `en distintas zonas de ${cityName}`),
    },
  ]
}

function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

export default function WhatsAppBot({ siteContent }: WhatsAppBotProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || pathname.startsWith('/admin')) return null

  const phone = cleanPhone(siteContent.contactWhatsapp)
  const FAQ_ITEMS = getFaqItems(t, siteContent.cityName)

  const handleQuestionClick = (item: FAQItem) => {
    const message = encodeURIComponent(item.answer)
    const url = `https://wa.me/${phone}?text=${message}`
    window.open(url, '_blank')
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Panel de preguntas */}
      {isOpen && (
        <div className="mb-4 w-80 rounded-2xl shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-5 backdrop-blur-xl" style={{ backgroundColor: 'rgba(44, 44, 44, 0.9)', borderColor: 'var(--brand-border)' }}>
          {/* Header */}
          <div className="bg-[#25D366] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Tiempo Masa Madre</h3>
                <p className="text-xs text-white/80">{t.whatsappRespond}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensaje de bienvenida */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--brand-border)' }}>
            <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
              {t.whatsappGreeting}
            </p>
          </div>

          {/* Lista de preguntas */}
          <div className="max-h-80 overflow-y-auto">
            {FAQ_ITEMS.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuestionClick(item)}
                className="w-full px-4 py-3 text-left hover:opacity-80 transition-colors border-b last:border-0"
                style={{ borderColor: 'var(--brand-border)' }}
              >
                <p className="text-sm font-medium" style={{ color: 'var(--brand-text-primary)' }}>{item.question}</p>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--brand-border)' }}>
            <button
              onClick={() => {
                const message = encodeURIComponent(t.whatsappDefaultMessage)
                const url = `https://wa.me/${phone}?text=${message}`
                window.open(url, '_blank')
                setIsOpen(false)
              }}
              className="w-full py-2 bg-[#25D366] hover:bg-[#20b858] text-white font-medium rounded-lg transition-colors text-sm"
            >
              💬 {t.whatsappFreeMessage}
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? t.whatsappChatClose : t.whatsappChatOpen}
        className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110"
        style={{ backgroundColor: '#25D366' }}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <WhatsAppIcon className="w-7 h-7 text-white" />
        )}
      </button>
    </div>
  )
}
