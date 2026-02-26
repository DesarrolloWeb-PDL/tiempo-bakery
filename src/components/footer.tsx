'use client'

import { useAppTheme } from '@/hooks/useAppTheme'
import Image from 'next/image'

export default function Footer() {
  const { theme } = useAppTheme()

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
                  src={theme.logoUrl}
                  alt={theme.appTitle}
                  className="h-6 w-6 inline-block mr-2 object-contain"
                  width={24}
                  height={24}
                />
              )}
              {theme.appTitle}
            </h3>
            <p className="text-sm text-gray-600">
              {theme.appSubtitle}
              <br />
              Horneado fresco cada semana.
            </p>
          </div>

          {/* Horarios */}
          <div>
            <h3 
              className="font-semibold mb-3"
              style={{ color: theme.primaryColor }}
            >
              Horario de Pedidos
            </h3>
            <p className="text-sm text-gray-600">
              Miércoles 18:00 - Domingo 20:00
              <br />
              <span className="text-xs text-gray-500">
                Entregas: Viernes y Sábado
              </span>
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h3 
              className="font-semibold mb-3"
              style={{ color: theme.primaryColor }}
            >
              Contacto
            </h3>
            <p className="text-sm text-gray-600">
              Email: contacto@tiempobakery.com
              <br />
              Tel: +34 XXX XXX XXX
            </p>
          </div>
        </div>

        <div 
          className="mt-8 pt-6 border-t"
          style={{ borderColor: theme.primaryColor + '30' }}
        >
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {theme.appTitle}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
