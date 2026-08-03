'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'
import type { SiteContent } from '@/lib/site-content.shared'

interface WhatsAppBotProps {
  siteContent: SiteContent
}

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: '🍞 ¿Qué es el pan de masa madre?',
    answer: 'El pan de masa madre es un pan fermentado naturalmente con una masa de harina y agua que captura levaduras salvajes del ambiente. No usamos levadura industrial: fermentamos lento para obtener mejor sabor, textura y digestibilidad.',
  },
  {
    question: '📅 ¿Cuándo se entregan los pedidos?',
    answer: 'La preventa abre los miércoles a las 18:00 y cierra el domingo a las 20:00. La entrega se realiza el día del horneado, que coordinamos según tu punto de recogida o envío.',
  },
  {
    question: '🚚 ¿Hacen envíos a domicilio?',
    answer: 'Sí, ofrecemos reparto local dentro del casco urbano y mensajería urgente para otras zonas. El reparto local se coordina el mismo día del horneado.',
  },
  {
    question: '🌾 ¿Tienen opciones sin gluten?',
    answer: 'Nuestros panes contienen trigo. Si tenés intolerancia o alergia, consultanos por opciones específicas o productos alternativos que podamos preparar.',
  },
  {
    question: '🛒 ¿Cómo hago mi pedido?',
    answer: 'Entrá a nuestra tienda online, elegí los productos y completá el checkout. Podés pagar con Mercado Pago, tarjeta o transferencia bancaria. ¡Es rápido y seguro!',
  },
  {
    question: '📍 ¿Dónde retiran los pedidos?',
    answer: 'Tenemos puntos de recogida en distintas zonas de Utrera. Elegís el que más te convenga al hacer tu pedido. ¡Coordinamos todo para que sea fácil!',
  },
]

function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

export default function WhatsAppBot({ siteContent }: WhatsAppBotProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || pathname.startsWith('/admin')) return null

  const phone = cleanPhone(siteContent.contactWhatsapp)

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
        <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#25D366] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Tiempo Bakery</h3>
                <p className="text-xs text-white/80">Respondemos al instante</p>
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
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              ¡Hola! 👋 Elegí una pregunta frecuente o escribinos directo:
            </p>
          </div>

          {/* Lista de preguntas */}
          <div className="max-h-80 overflow-y-auto">
            {FAQ_ITEMS.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuestionClick(item)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <p className="text-sm font-medium text-gray-800">{item.question}</p>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <button
              onClick={() => {
                const message = encodeURIComponent('Hola, vengo de Tiempo Bakery...')
                const url = `https://wa.me/${phone}?text=${message}`
                window.open(url, '_blank')
                setIsOpen(false)
              }}
              className="w-full py-2 bg-[#25D366] hover:bg-[#20b858] text-white font-medium rounded-lg transition-colors text-sm"
            >
              💬 Escribir mensaje libre
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat de WhatsApp'}
        className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110"
        style={{ backgroundColor: '#25D366' }}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-7 h-7"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )}
      </button>
    </div>
  )
}
